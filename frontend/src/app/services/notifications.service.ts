import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { DataService, Notificacion } from './data.service';
import { AuthService } from './auth.service';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

const POLL_INTERVAL_MS = 60_000; // Refresca cada 60 segundos

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
  private dataService = inject(DataService);
  private auth = inject(AuthService);

  // Estado reactivo
  private _notificaciones = signal<Notificacion[]>([]);
  readonly notificaciones = this._notificaciones.asReadonly();

  readonly noLeidas = computed(() =>
    this._notificaciones().filter(n => !n.leida).length
  );

  readonly hayNoLeidas = computed(() => this.noLeidas() > 0);

  private _pollSub: Subscription | null = null;

  constructor() {
    // Inicia el polling cuando el usuario esté autenticado
    this._pollSub = interval(POLL_INTERVAL_MS)
      .pipe(startWith(0))
      .subscribe(() => {
        if (this.auth.isAuthenticated()) {
          this._fetchNotificaciones();
        }
      });
  }

  ngOnDestroy(): void {
    this._pollSub?.unsubscribe();
  }

  /** Fuerza una recarga inmediata de las notificaciones. */
  refresh(): void {
    this._fetchNotificaciones();
  }

  /** Marca una notificación como leída localmente + llama al backend. */
  marcarLeida(id: number): void {
    // Optimistic update
    this._notificaciones.update(ns =>
      ns.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
    );
    this.dataService.marcarLeida(id).subscribe({
      error: () => this.refresh(), // Rollback on error
    });
  }

  /** Marca todas como leídas localmente + llama al backend. */
  marcarTodasLeidas(): void {
    // Optimistic update
    this._notificaciones.update(ns => ns.map(n => ({ ...n, leida: true })));
    this.dataService.marcarTodasLeidas().subscribe({
      error: () => this.refresh(), // Rollback on error
    });
  }

  // ---------------------------------------------------------------------------
  // Privados
  // ---------------------------------------------------------------------------
  private _fetchNotificaciones(): void {
    this.dataService.getNotificaciones().subscribe({
      next: (res) => this._notificaciones.set(res.results ?? []),
      error: () => { /* Silencioso — la UI no debe romperse por fallos de red */ },
    });
  }
}
