import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard funcional que protege las rutas del layout principal.
 * - Si hay un token en localStorage, intenta cargar el perfil del usuario.
 * - Si tiene éxito, permite el acceso.
 * - Si no hay token o el token expiró, redirige a /login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si ya tenemos el usuario cargado en memoria, pasa directamente
  if (auth.isAuthenticated()) return true;

  // Si hay token en storage, intentar cargar el perfil
  if (auth.hasToken()) {
    return auth.loadMe().pipe(
      map(() => true),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      }),
    );
  }

  // Sin token → redirigir a login
  router.navigate(['/login']);
  return false;
};
