import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/services/auth.service';
import { RootModel } from '../../core/models/master/root.model';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    PasswordModule,
    InputTextModule,
    AppFloatingConfigurator,
  ],
  template: `
    <app-floating-configurator></app-floating-configurator>
    <main class="relative flex min-h-screen min-w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 px-4 py-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <section class="relative w-full max-w-[390px] overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_15px_35px_-15px_rgba(99,102,241,0.12)] backdrop-blur-md sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/90">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500"></div>

        @if (resetComplete) {
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <i class="pi pi-check text-2xl"></i>
            </div>
            <h1 class="m-0 text-xl font-bold text-slate-800 dark:text-white">Password updated</h1>
            <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Your password has been reset successfully. You can now sign in with your new password.</p>
            <p-button routerLink="/auth/login" label="Continue to sign in" styleClass="mt-5 h-10 w-full justify-center rounded-xl"></p-button>
          </div>
        } @else if (invalidLink) {
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <i class="pi pi-exclamation-triangle text-xl"></i>
            </div>
            <h1 class="m-0 text-xl font-bold text-slate-800 dark:text-white">Invalid reset request</h1>
            <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">The email address is missing. Request a new verification code.</p>
            <p-button routerLink="/auth/forgot-password" label="Request a new code" styleClass="mt-5 h-10 w-full justify-center rounded-xl"></p-button>
          </div>
        } @else if (!codeVerified) {
          <div class="mb-6 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <i class="pi pi-key text-xl"></i>
            </div>
            <h1 class="m-0 text-xl font-bold text-slate-800 dark:text-white">Verify your code</h1>
            <p class="mb-0 mt-2 text-sm text-slate-500 dark:text-slate-400">Enter the 6-digit code sent to {{ email }}.</p>
          </div>

          <form #verifyForm="ngForm" class="flex flex-col gap-4" (ngSubmit)="verifyCode(verifyForm)" novalidate>
            <div class="flex flex-col gap-1.5">
              <label for="verificationCode" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Verification code</label>
              <input
                pInputText
                id="verificationCode"
                name="code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="000000"
                class="h-12 w-full text-center text-xl font-bold tracking-[0.45em]"
                [(ngModel)]="code"
                #codeModel="ngModel"
                (ngModelChange)="onCodeChanged()"
                required
                pattern="[0-9]{6}"
                maxlength="6"
                [disabled]="codeExpired || loading"
              />
              @if (codeModel.invalid && codeModel.touched) {
                <small class="text-xs text-red-500">Enter the 6-digit code from your email.</small>
              }

              @if (!codeExpired) {
                <div class="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <i class="pi pi-clock"></i>
                  <span>Code expires in {{ formatTime(otpRemainingSeconds()) }}</span>
                </div>
              } @else {
                <div class="mt-1 text-center">
                  <small class="font-semibold text-red-500">Code expired.</small>
                </div>
              }
            </div>

            @if (!codeExpired) {
              <p-button type="submit" label="Verify code" icon="pi pi-check-circle" iconPos="right" [loading]="loading" styleClass="h-10 w-full justify-center rounded-xl"></p-button>
              <p class="m-0 text-center text-[11px] text-slate-400">The code is verified automatically after all 6 digits are entered.</p>
            } @else {
              <p-button type="button" label="Resend code" icon="pi pi-refresh" [loading]="resending" (onClick)="resendCode()" styleClass="h-10 w-full justify-center rounded-xl"></p-button>
            }
            <a routerLink="/auth/login" class="text-center text-xs font-semibold text-slate-500 no-underline hover:text-primary hover:underline dark:text-slate-400">Back to sign in</a>
          </form>
        } @else {
          <div class="mb-5 text-center">
            <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <i class="pi pi-check text-xl"></i>
            </div>
            <h1 class="m-0 text-xl font-bold text-slate-800 dark:text-white">Create new password</h1>
            <p class="mb-0 mt-2 text-sm text-slate-500 dark:text-slate-400">Code verified. You now have 5 minutes to set your password.</p>
          </div>

          <form #passwordForm="ngForm" class="flex flex-col gap-4" (ngSubmit)="submitPassword(passwordForm)" novalidate>
            @if (!resetSessionExpired) {
              <div class="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <i class="pi pi-shield"></i>
                <span>Secure session: {{ formatTime(sessionRemainingSeconds()) }}</span>
              </div>
            } @else {
              <div class="rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                Password reset session expired.
              </div>
            }

            <div class="flex flex-col gap-1.5">
              <label for="newPassword" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">New password</label>
              <p-password inputId="newPassword" name="newPassword" [(ngModel)]="newPassword" #newPasswordModel="ngModel" autocomplete="new-password" placeholder="Enter new password" required [minlength]="6" [toggleMask]="true" [feedback]="true" [fluid]="true" styleClass="w-full" inputStyleClass="h-10 w-full custom-input text-xs"></p-password>
              @if (newPasswordModel.invalid && newPasswordModel.touched) {
                <small class="text-xs text-red-500">Password must be at least 6 characters.</small>
              }
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="confirmPassword" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirm password</label>
              <p-password inputId="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" #confirmPasswordModel="ngModel" autocomplete="new-password" placeholder="Re-enter new password" required [toggleMask]="true" [feedback]="false" [fluid]="true" styleClass="w-full" inputStyleClass="h-10 w-full custom-input text-xs"></p-password>
              @if (confirmPasswordModel.touched && (confirmPasswordModel.invalid || passwordsDoNotMatch)) {
                <small class="text-xs text-red-500">Passwords must match.</small>
              }
            </div>

            @if (!resetSessionExpired) {
              <p-button type="submit" label="Reset password" icon="pi pi-check" iconPos="right" [loading]="loading" styleClass="h-10 w-full justify-center rounded-xl border-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-sm font-semibold text-white dark:from-indigo-600 dark:via-indigo-700 dark:to-indigo-600"></p-button>
            } @else {
              <p-button type="button" label="Request a new code" icon="pi pi-refresh" [loading]="resending" (onClick)="resendCode()" styleClass="h-10 w-full justify-center rounded-xl"></p-button>
            }
          </form>
        }
      </section>
    </main>
  `,
})
export class ResetPassword implements OnInit, OnDestroy {
  private readonly fallbackOtpLifetimeSeconds = 180;
  private readonly fallbackSessionLifetimeSeconds = 5 * 60;

  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';
  resetToken = '';
  loading = false;
  resending = false;
  invalidLink = false;
  codeVerified = false;
  resetComplete = false;
  otpRemainingSeconds = signal(0);
  sessionRemainingSeconds = signal(0);

  private otpExpiresAtUnix = 0;
  private sessionExpiresAtUnix = 0; 
  private countdownTimer?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.otpExpiresAtUnix = Number(
      this.route.snapshot.queryParamMap.get('expiresAt') ?? 0,
    );
    this.invalidLink = !this.email;

    if (
      !this.invalidLink &&
      (!Number.isFinite(this.otpExpiresAtUnix) || this.otpExpiresAtUnix <= 0)
    ) {
      this.otpExpiresAtUnix =
        Math.floor(Date.now() / 1000) + this.fallbackOtpLifetimeSeconds;
    }

    if (!this.invalidLink) this.startOtpCountdown();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  get codeExpired(): boolean {
    return this.otpRemainingSeconds() <= 0;
  }

  get resetSessionExpired(): boolean {
    return this.sessionRemainingSeconds() <= 0;
  }

  get passwordsDoNotMatch(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  formatTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (safeSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  onCodeChanged(): void {
    if (/^\d{6}$/.test(this.code) && !this.loading && !this.codeExpired) {
      this.verifyCode();
    }
  }

  verifyCode(form?: NgForm): void {
    if (!/^\d{6}$/.test(this.code) || this.codeExpired || this.loading) {
      form?.control.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.verifyResetCode(this.email, this.code).subscribe({
      next: (response: RootModel) => {
        if (!response.success) return;

        this.resetToken = String(response.data?.reset_token ?? '');
        if (!this.resetToken) return;

        const serverExpiresAt = Number(response.data?.expires_at_unix ?? 0);
        const lifetimeSeconds = Number(
          response.data?.expires_in_seconds ??
            this.fallbackSessionLifetimeSeconds,
        );
        this.sessionExpiresAtUnix = this.resolveExpiry(
          serverExpiresAt,
          lifetimeSeconds,
          this.fallbackSessionLifetimeSeconds,
        );
        this.codeVerified = true;
        this.code = '';
        this.startSessionCountdown();
      },
      error: () => (this.loading = false),
      complete: () => (this.loading = false),
    });
  }

  resendCode(): void {
    if (this.resending) return;

    this.resending = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (response: RootModel) => {
        if (!response.success) return;

        const serverExpiresAt = Number(response.data?.expires_at_unix ?? 0);
        const lifetimeSeconds = Number(
          response.data?.expires_in_seconds ?? this.fallbackOtpLifetimeSeconds,
        );
        this.otpExpiresAtUnix = this.resolveExpiry(
          serverExpiresAt,
          lifetimeSeconds,
          this.fallbackOtpLifetimeSeconds,
        );
        this.code = '';
        this.resetToken = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.codeVerified = false;
        this.startOtpCountdown();
      },
      error: () => (this.resending = false),
      complete: () => (this.resending = false),
    });
  }

  submitPassword(form: NgForm): void {
    if (
      form.invalid ||
      this.passwordsDoNotMatch ||
      !this.resetToken ||
      this.resetSessionExpired
    ) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService
      .resetPassword(
        this.email,
        this.resetToken,
        this.newPassword,
        this.confirmPassword,
      )
      .subscribe({
        next: (response: RootModel) => {
          if (response.success) {
            this.resetComplete = true;
            this.stopCountdown();
          }
        },
        error: () => (this.loading = false),
        complete: () => (this.loading = false),
      });
  }

  private resolveExpiry(
    serverExpiresAt: number,
    lifetimeSeconds: number,
    fallbackLifetimeSeconds: number,
  ): number {
    if (Number.isFinite(serverExpiresAt) && serverExpiresAt > 0) {
      return serverExpiresAt;
    }

    const validLifetime =
      Number.isFinite(lifetimeSeconds) && lifetimeSeconds > 0
        ? lifetimeSeconds
        : fallbackLifetimeSeconds;
    return Math.floor(Date.now() / 1000) + validLifetime;
  }

  private startOtpCountdown(): void {
    this.stopCountdown();
    this.updateOtpCountdown();
    this.countdownTimer = setInterval(() => this.updateOtpCountdown(), 250);
  }

  private startSessionCountdown(): void {
    this.stopCountdown();
    this.updateSessionCountdown();
    this.countdownTimer = setInterval(
      () => this.updateSessionCountdown(),
      250,
    );
  }

  private updateOtpCountdown(): void {
    const seconds = Math.max(
      0,
      Math.ceil((this.otpExpiresAtUnix * 1000 - Date.now()) / 1000),
    );
    this.otpRemainingSeconds.set(seconds);
    if (seconds === 0) this.stopCountdown();
  }

  private updateSessionCountdown(): void {
    const seconds = Math.max(
      0,
      Math.ceil((this.sessionExpiresAtUnix * 1000 - Date.now()) / 1000),
    );
    this.sessionRemainingSeconds.set(seconds);
    if (seconds === 0) this.stopCountdown();
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }
}
