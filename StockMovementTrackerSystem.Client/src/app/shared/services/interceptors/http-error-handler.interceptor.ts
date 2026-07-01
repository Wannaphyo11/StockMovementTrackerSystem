import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { LoggerService } from '../logger.service';
import { environment } from '../../../../environments/environment';

export const httpErrorHandlerInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const messageService = inject(MessageService);
  const loggerService = inject(LoggerService);
  const startTime = Date.now();

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        const applicationError = error.headers.get('Application-Error');
        if (applicationError) {
          return throwError(() => new Error(applicationError));
        }
        messageService.add({
          key: environment.default_toastKey,
          severity: 'info',
          summary: "We're sorry.",
          detail: error.error?.message?.en,
        });
        return throwError(() => new Error(error.error.error?.message?.en));
      } else {
        if (error !== 'OK') {
          loggerService.error(error);

          if (error instanceof Object) {
            // Handle object error
          }
          // Handle other error types
        }
        return throwError(() => new Error('ok'));
      }
    }),
    finalize(() => {
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      if (environment.debug) {
        loggerService.info(
          `\nAPI Call ==> ${req.url.replace('https://localhost', '').split('/').slice(1).join('/')} [${elapsedTime} ms]`,
        );
      }
    }),
  );
};