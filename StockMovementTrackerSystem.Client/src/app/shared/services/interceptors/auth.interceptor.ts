import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../logger.service';

export const authInterceptorFn: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const loggerService = inject(LoggerService);
  const router = inject(Router);

  const token = window.localStorage.getItem('access_token');
  if (
    request.url.includes('attachment') ||
    request.url.includes('uploadsign')
  ) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${ token }`,
        Accept: 'application/json',
      },
    });
  } else {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${ token }`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  return next(request).pipe(
    catchError((err) => {
      switch (err.status) {
        case 400:
          loggerService.error(err.error);
          break;
        case 401:
          loggerService.error(err.error);
          authService.logoutForce();
          router.navigate(['/auth/login']);
          break;
        case 403:
          loggerService.error(err.error);
          authService.logoutForce();
          break;
      }

      // ❗ important: propagate the ORIGINAL error
      return throwError(() => err);
    }),
  );
};