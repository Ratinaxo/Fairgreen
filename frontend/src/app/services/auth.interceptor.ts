import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Interceptor funcional de Angular que:
 * 1. Adjunta el Bearer token a cada request saliente.
 * 2. Si el backend responde con 401, intenta renovar el token con el refresh.
 * 3. Si el refresh también falla, hace logout y redirige a /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  // Clonar el request con el header de autorización (solo si hay token)
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 y tenemos refresh token, intentar renovar
      if (error.status === 401 && auth.getRefreshToken()) {
        return auth.refreshAccessToken().pipe(
          switchMap((res) => {
            // Reintentar el request original con el nuevo token
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.access}` },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh también falló → logout
            auth.logout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
