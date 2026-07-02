import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Servicio de Heartbeat.
 * Envía un POST /api/auth/heartbeat cada 60 segundos para indicar
 * al backend que el usuario sigue conectado a la plataforma.
 * El backend guarda esta señal en caché con un TTL de 120 segundos.
 */
@Injectable({ providedIn: 'root' })
export class HeartbeatService implements OnDestroy {
  private readonly api = environment.apiUrl;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly INTERVAL_MS = 60_000; // 60 segundos

  constructor(private http: HttpClient) {}

  /** Inicia el heartbeat. Si ya está corriendo, no hace nada. */
  start(): void {
    if (this.intervalId) return;

    // Enviar inmediatamente al iniciar
    this._sendHeartbeat();

    // Luego cada 60 segundos
    this.intervalId = setInterval(() => this._sendHeartbeat(), this.INTERVAL_MS);
  }

  /** Detiene el heartbeat. */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private _sendHeartbeat(): void {
    this.http.post(`${this.api}/auth/heartbeat`, {}).subscribe({
      error: () => {
        // Silenciar errores de heartbeat (ej: token expirado, server caído)
      }
    });
  }
}
