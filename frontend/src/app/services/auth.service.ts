import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// ---------------------------------------------------------------------------
// Tipos de la API
// ---------------------------------------------------------------------------
export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface Usuario {
  rut: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: 'ADMIN' | 'AGRO' | 'CANCHERO';
  ruta_foto: string | null;
  is_active: boolean;
}

const TOKEN_KEY = 'fg_access';
const REFRESH_KEY = 'fg_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  // Signal reactivo con el usuario actual. null = no autenticado.
  private _usuario = signal<Usuario | null>(null);
  readonly usuario = this._usuario.asReadonly();
  readonly isAuthenticated = computed(() => this._usuario() !== null);
  readonly rol = computed(() => this._usuario()?.rol ?? null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // ---------------------------------------------------------------------------
  // Login: obtiene tokens JWT y carga el perfil del usuario
  // ---------------------------------------------------------------------------
  login(correo_electronico: string, password: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.api}/token/`, { correo_electronico, password })
      .pipe(
        tap((tokens) => {
          this._saveTokens(tokens);
        }),
        catchError((err) => this._handleError(err)),
      );
  }

  // ---------------------------------------------------------------------------
  // Carga el perfil del usuario desde /api/auth/me (requiere token en storage)
  // ---------------------------------------------------------------------------
  loadMe(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.api}/auth/me`).pipe(
      tap((usuario) => this._usuario.set(usuario)),
      catchError((err) => {
        this._usuario.set(null);
        return throwError(() => err);
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Refresh del access token usando el refresh token guardado
  // ---------------------------------------------------------------------------
  refreshAccessToken(): Observable<{ access: string }> {
    const refresh = this.getRefreshToken();
    if (!refresh) return throwError(() => new Error('No refresh token'));

    return this.http
      .post<{ access: string }>(`${this.api}/token/refresh/`, { refresh })
      .pipe(
        tap((res) => localStorage.setItem(TOKEN_KEY, res.access)),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        }),
      );
  }

  // ---------------------------------------------------------------------------
  // Logout: limpia tokens y estado
  // ---------------------------------------------------------------------------
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  // ---------------------------------------------------------------------------
  // Helpers de token
  // ---------------------------------------------------------------------------
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  // ---------------------------------------------------------------------------
  // Privados
  // ---------------------------------------------------------------------------
  private _saveTokens(tokens: TokenResponse): void {
    localStorage.setItem(TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  }

  private _handleError(err: HttpErrorResponse) {
    let message = 'Error de conexión con el servidor.';
    if (err.status === 401) {
      if (err.error?.detail) {
        const detailStr = String(err.error.detail);
        if (detailStr.includes('No active account') || detailStr.includes('inactiva') || detailStr.includes('disabled')) {
          message = 'Tu cuenta de usuario está desactivada. Contacta al administrador.';
        } else {
          message = 'Correo o contraseña incorrectos.';
        }
      } else {
        message = 'Correo o contraseña incorrectos.';
      }
    } else if (err.status === 400) {
      message = err.error?.detail || 'Solicitud incorrecta. Verifica tus datos.';
    } else if (err.status === 0) {
      message = 'No se puede conectar con el servidor.';
    } else {
      message = err.error?.detail || message;
    }
    return throwError(() => new Error(message));
  }
}
