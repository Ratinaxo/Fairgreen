import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard funcional parametrizado que protege rutas según el rol del usuario.
 *
 * Uso en routes:
 *   canActivate: [roleGuard(['ADMIN', 'AGRO'])]
 *
 * Si el usuario no tiene el rol requerido, se redirige al dashboard.
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const checkRole = (): boolean => {
      const rol = auth.rol();
      if (rol && allowedRoles.includes(rol)) return true;
      router.navigate(['/dashboard']);
      return false;
    };

    // Si ya tenemos el usuario en memoria, verificar directamente
    if (auth.isAuthenticated()) {
      return checkRole();
    }

    // Si hay token pero sin usuario cargado, cargar perfil primero
    if (auth.hasToken()) {
      return auth.loadMe().pipe(
        map(() => checkRole()),
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
}
