import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { CookieService } from 'ngx-cookie-service';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { SharedService } from '../../shared/services/shared.service';
import { RootModel } from '../../core/models/master/root.model';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    RouterModule,
    RippleModule,
    DialogModule,
    AppFloatingConfigurator,
    TranslatePipe,
  ],
  template: `
    <app-floating-configurator></app-floating-configurator>
    <main
      class="relative flex min-h-screen min-w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 px-4 py-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      <div class="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-200/30 opacity-40 blur-3xl dark:bg-indigo-900/10"></div>
      <div class="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-sky-200/30 opacity-40 blur-3xl dark:bg-sky-900/10"></div>

      <section
        class="relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_15px_35px_-15px_rgba(99,102,241,0.12)] backdrop-blur-md sm:p-7 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-black/20"
      >
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500"></div>

        <div class="w-full">
          <div class="mb-5 text-center">
            <h2 class="m-0 text-xl font-bold tracking-tight text-slate-800 dark:text-white uppercase">
              PRODUCT STOCK TRACKER
            </h2>
            <p class="mb-0 mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
              Sign in to continue
            </p>
          </div>

          <form #loginForm="ngForm" class="flex flex-col gap-4" (ngSubmit)="login(loginForm)" novalidate>
            
            <div class="flex flex-col gap-1">
              <label
                for="username1"
                class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {{ 'EMAIL_OR_USERNAME' | translate }}
              </label>
              <div class="relative w-full flex items-center">
                <i class="pi pi-user absolute left-3.5 text-sm text-slate-400 z-20 pointer-events-none"></i>
                <input
                  pInputText
                  id="username1"
                  name="username"
                  type="text"
                  autocomplete="username"
                  placeholder="Enter username or email"
                  class="h-10 w-full custom-input text-xs"
                  [(ngModel)]="username"
                  #usernameModel="ngModel"
                  required
                />
              </div>
              @if (usernameModel.invalid && usernameModel.touched) {
                <small class="text-xs text-red-500">Username is required.</small>
              }
            </div>

            <div class="flex flex-col gap-1">
              <label
                for="password1"
                class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {{ 'PASSWORD' | translate }}
              </label>
              <div class="relative w-full flex items-center">
                <i class="pi pi-lock absolute left-3.5 text-sm text-slate-400 z-20 pointer-events-none"></i>
                <p-password
                  inputId="password1"
                  name="password"
                  [(ngModel)]="password"
                  #passwordModel="ngModel"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                  [toggleMask]="true"
                  [fluid]="true"
                  [feedback]="false"
                  styleClass="w-full"
                  inputStyleClass="h-10 w-full custom-input text-xs"
                ></p-password>
              </div>
              @if (passwordModel.invalid && passwordModel.touched) {
                <small class="text-xs text-red-500">Password is required.</small>
              }
            </div>

            <div class="flex items-center justify-between gap-3 pt-0.5">
              <div class="flex items-center gap-1.5">
                <p-checkbox
                  [(ngModel)]="isRemberMeChecked"
                  id="rememberme1"
                  name="rememberMe"
                  binary
                  (onChange)="rememberMeChange($event)"
                ></p-checkbox>
                <label
                  for="rememberme1"
                  class="select-none cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  {{ 'REMEMBER_ME' | translate }}
                </label>
              </div>
              <a
                routerLink="/auth/forgot-password"
                class="ml-2 cursor-pointer text-right text-xs font-semibold text-primary no-underline hover:underline"
              >{{ 'FORGOT_PASSWORD' | translate }}</a>
            </div>

            <p-button
              type="submit"
              label="Sign In"
              iconPos="right"
              styleClass="h-10 w-full justify-center rounded-xl border-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-indigo-600 dark:via-indigo-700 dark:to-indigo-600 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99]"
              [loading]="loading"
            ></p-button>
          </form>

          <div
            class="mt-6 flex items-center justify-center gap-1 border-t border-slate-100 pt-4 text-[10px] font-medium text-slate-400 dark:border-slate-800/60 dark:text-slate-500"
          >
            <span>Powered by</span>
            <span class="font-bold text-slate-600 dark:text-slate-400 tracking-wide">EFFICIENT SOFT</span>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class Login implements OnInit {
  isRemberMeChecked: boolean = false;

  username: string = '';
  password: string = '';

  loading: boolean = false;
  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    if (window.localStorage.getItem('remember-me') === 'remember') {
      this.isRemberMeChecked = true;
    }
  }

  rememberMeChange(event: any): void {
    this.isRemberMeChecked = event.checked ?? event.target?.checked ?? false;
    if (this.isRemberMeChecked) {
      window.localStorage.setItem('remember-me', 'remember');
    } else {
      window.localStorage.removeItem('remember-me');
    }
  }

  login(form: NgForm): void {
    if (form.invalid || !this.username.trim() || !this.password) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.isRemberMeChecked)
      window.localStorage.setItem('remember-me', this.isRemberMeChecked ? 'remember' : '');

    this.loading = true;
    this.authService.accessToken(this.username.trim(), this.password).subscribe({
      next: (res: RootModel) => {
        this.loading = false;
        if (res.success) {
          this.setValueToSession(res);
          this.router.navigate(['/dashboard']);
        } else {
          console.error('Login failed:', res.message);
        }
      },
      error: (err) => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
  setValueToSession(res: RootModel) {
    window.localStorage.setItem('access_token', res.data.access_token);
    window.localStorage.setItem('refresh_token', res.data.refresh_token);

    const path = '/';

    const expirationDays = typeof res.data.expiration === 'number' ? res.data.expiration : 30;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    const userId = res.data.user?.id || res.data.user?.Id || '';
    const username = res.data.user?.userName || res.data.user?.UserName || '';
    const userRole = res.data.user?.user_role || res.data.user?.userRole || 'admin';

    this.cookieService.set('userId', userId, { expires: expirationDate, path: path });
    this.cookieService.set('username', username, {
      expires: expirationDate,
      path: path,
    });
    this.cookieService.set('userrole', userRole, {
      expires: expirationDate,
      path: path,
    });
    this.cookieService.set('authorized_status', 'authorized', {
      expires: expirationDate,
      path: path,
    });
  }
}
