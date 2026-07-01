import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { ApiLoadingService } from '../api-loading.service';
import { finalize } from 'rxjs/operators';

export const httpRequestHeaderInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {

  const apiLoadingService = inject(ApiLoadingService);
  apiLoadingService.startLoading();

  // Clone the request to add custom headers
  const modifiedReq = req.clone({
    headers: req.headers.set('Accept-Language', 'MM'),
  });

  return next(modifiedReq).pipe(
    finalize(() => apiLoadingService.stopLoading()),
  );
};