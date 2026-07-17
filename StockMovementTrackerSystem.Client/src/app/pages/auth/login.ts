import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
            <h1 class="m-0 text-xl font-bold tracking-tight text-slate-800 dark:text-white uppercase">
              PRODUCT STOCK TRACKER
            </h1>
            <p class="mb-0 mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
              Sign in to continue
            </p>
          </div>

          <form class="flex flex-col gap-4" (ngSubmit)="login()">
            
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
                />
              </div>
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
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  [toggleMask]="true"
                  [fluid]="true"
                  [feedback]="false"
                  styleClass="w-full"
                  inputStyleClass="h-10 w-full custom-input text-xs"
                ></p-password>
              </div>
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
              <button
                type="button"
                class="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                (click)="openChangePasswordDialog()"
              >
                {{ 'FORGOT_PASSWORD' | translate }}
              </button>
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

    <p-dialog
      header="Change Password"
      [(visible)]="changePasswordVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!changingPassword"
      [breakpoints]="{ '575px': '92vw' }"
      [style]="{ width: '25rem' }"
      styleClass="custom-dialog rounded-2xl overflow-hidden"
      (onHide)="resetChangePasswordForm()"
    >
      <div class="flex flex-col gap-3.5 pt-1">
        <div
          class="flex items-center gap-2.5 rounded-xl border border-indigo-50 bg-indigo-50/50 p-3 text-xs text-slate-600 dark:border-indigo-500/10 dark:bg-indigo-500/5 dark:text-slate-400"
        >
          <i class="pi pi-info-circle text-indigo-600 dark:text-indigo-400"></i>
          @if (username.trim()) {
            <span>
              Password will be changed for
              <strong class="text-slate-800 dark:text-slate-200">{{ username.trim() }}</strong>
            </span>
          } @else {
            <span>Enter your username or email in the login form before submitting.</span>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label for="oldPassword" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Old Password
          </label>
          <div class="relative w-full flex items-center">
            <i class="pi pi-lock absolute left-3.5 text-slate-400 z-20 pointer-events-none"></i>
            <p-password
              inputId="oldPassword"
              [(ngModel)]="oldPassword"
              [toggleMask]="true"
              [fluid]="true"
              [feedback]="false"
              placeholder="Enter old password"
              styleClass="w-full"
              inputStyleClass="h-10 w-full custom-input text-xs"
            ></p-password>
          </div>
          @if (changePasswordSubmitted && !oldPassword) {
            <small class="text-xs font-medium text-red-500">Old password is required.</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label for="newPassword" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            New Password
          </label>
          <div class="relative w-full flex items-center">
            <i class="pi pi-lock absolute left-3.5 text-slate-400 z-20 pointer-events-none"></i>
            <p-password
              inputId="newPassword"
              [(ngModel)]="newPassword"
              [toggleMask]="true"
              [fluid]="true"
              [feedback]="true"
              placeholder="Enter new password"
              styleClass="w-full"
              inputStyleClass="h-10 w-full custom-input text-xs"
            ></p-password>
          </div>
          @if (changePasswordSubmitted && !newPassword) {
            <small class="text-xs font-medium text-red-500">New password is required.</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label for="confirmPassword" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Confirm Password
          </label>
          <div class="relative w-full flex items-center">
            <i class="pi pi-lock absolute left-3.5 text-slate-400 z-20 pointer-events-none"></i>
            <p-password
              inputId="confirmPassword"
              [(ngModel)]="confirmPassword"
              [toggleMask]="true"
              [fluid]="true"
              [feedback]="false"
              placeholder="Confirm new password"
              styleClass="w-full"
              (keydown.enter)="changePassword()"
              inputStyleClass="h-10 w-full custom-input text-xs"
            ></p-password>
          </div>
          @if (changePasswordSubmitted && !confirmPassword) {
            <small class="text-xs font-medium text-red-500">Confirm password is required.</small>
          } @else if (
            changePasswordSubmitted &&
            newPassword &&
            confirmPassword &&
            newPassword !== confirmPassword
          ) {
            <small class="text-xs font-medium text-red-500">
              New password and confirm password do not match.
            </small>
          }
        </div>
      </div>

      <ng-template #footer>
        <div class="flex items-center justify-end gap-2 mt-1">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            [disabled]="changingPassword"
            (onClick)="closeChangePasswordDialog()"
            styleClass="rounded-xl h-9 text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
          ></p-button>
          <p-button
            label="Change Password"
            icon="pi pi-key"
            [loading]="changingPassword"
            (onClick)="changePassword()"
            styleClass="rounded-xl h-9 text-xs bg-slate-900 dark:bg-indigo-600 border-0"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class Login implements OnInit {
  isRemberMeChecked: boolean = false;

  username: string = '';
  password: string = '';

  loading: boolean = false;
  changePasswordVisible: boolean = false;
  changePasswordSubmitted: boolean = false;
  changingPassword: boolean = false;
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private sharedService: SharedService,
    private router: Router,
    private messageService: MessageService,
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

  login(): void {
    if (this.isRemberMeChecked)
      window.localStorage.setItem('remember-me', this.isRemberMeChecked ? 'remember' : '');

    this.loading = true;
    this.authService.accessToken(this.username, this.password).subscribe({
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

  openChangePasswordDialog(): void {
    this.changePasswordVisible = true;
  }

  closeChangePasswordDialog(): void {
    if (!this.changingPassword) {
      this.changePasswordVisible = false;
    }
  }

  resetChangePasswordForm(): void {
    if (this.changingPassword) {
      return;
    }

    this.changePasswordSubmitted = false;
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  changePassword(): void {
    this.changePasswordSubmitted = true;

    if (!this.username?.trim()) {
      this.showMessage('warn', 'Username required', 'Enter your username or email in the login form.');
      return;
    }

    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      return;
    }

    if (this.oldPassword === this.newPassword) {
      this.showMessage(
        'warn',
        'Invalid new password',
        'New password must be different from the old password.',
      );
      return;
    }

    this.changingPassword = true;
    this.authService
      .changePassword(
        this.username.trim(),
        this.oldPassword,
        this.newPassword,
        this.confirmPassword,
      )
      .subscribe({
        next: (res: RootModel) => {
          if (res.success) {
            this.password = '';
            this.changePasswordSubmitted = false;
            this.oldPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.changePasswordVisible = false;
            this.showMessage(
              'success',
              'Password changed',
              res.message?.en ??
              'Password changed successfully. Sign in with your new password.',
            );
          }
        },
        error: () => {
          this.changingPassword = false;
        },
        complete: () => {
          this.changingPassword = false;
        },
      });
  }

  private showMessage(
    severity: 'success' | 'info' | 'warn' | 'error',
    summary: string,
    detail: string,
  ): void {
    this.messageService.add({
      key: environment.default_toastKey,
      severity,
      summary,
      detail,
    });
  }

  setValueToSession(res: RootModel) {
    window.localStorage.setItem('access_token', res.data.access_token);
    window.localStorage.setItem('refresh_token', res.data.refresh_token);

    const path = environment.production ? '/' : '/uat';

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate + res.data.expiration);

    this.cookieService.set('userId', res.data.user.id, { expires: expirationDate, path: path });
    this.cookieService.set('username', res.data.user.userName, {
      expires: expirationDate,
      path: path,
    });
    this.cookieService.set('userrole', res.data.user.user_role, {
      expires: expirationDate,
      path: path,
    });
    this.cookieService.set('authorized_status', 'authorized', {
      expires: expirationDate,
      path: path,
    });
  }
}