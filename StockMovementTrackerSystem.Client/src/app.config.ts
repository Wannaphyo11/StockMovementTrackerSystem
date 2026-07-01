import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptorFn } from './app/shared/services/interceptors/auth.interceptor';
import { encryptHttpRequestInterceptor } from './app/shared/services/interceptors/encrypt.interceptor';
import { httpErrorHandlerInterceptor } from './app/shared/services/interceptors/http-error-handler.interceptor';
import { httpRequestHeaderInterceptor } from './app/shared/services/interceptors/http-request-header.interceptor';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { provideTranslateService } from '@ngx-translate/core';
import { providePrimeNG } from 'primeng/config';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      withEnabledBlockingInitialNavigation(),
    ),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideHttpClient(
      withFetch(),
      withInterceptors([
        httpErrorHandlerInterceptor,
        httpRequestHeaderInterceptor,
        encryptHttpRequestInterceptor,
        authInterceptorFn,
      ]),
    ),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    provideAnimationsAsync('animations'),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    }),
    MessageService,
  ],
};
