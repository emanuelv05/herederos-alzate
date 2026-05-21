import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // No aplicar el interceptor de autenticación a APIs externas (como Abstract API)
  if (req.url.includes('abstractapi.com')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si la petición devuelve 401 (No autorizado) o 403 (Prohibido)
      if (error.status === 401 || error.status === 403) {
        // Significa que el token no es válido, ha expirado o no existe.
        // Limpiamos los datos del sessionStorage que son inseguros
        sessionStorage.clear();
        // Redirigimos al usuario a la página de login
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
