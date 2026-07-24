import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/services/auth.service';
import { RootModel } from '../../core/models/master/root.model';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterModule, ButtonModule, InputTextModule, AppFloatingConfigurator],
  template: `
    <app-floating-configurator></app-floating-configurator>
    <main class="relative flex min-h-screen min-w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 px-4 py-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div class="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-200/30 opacity-40 blur-3xl dark:bg-indigo-900/10"></div>
      <section class="relative w-full max-w-[390px] overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_15px_35px_-15px_rgba(99,102,241,0.12)] backdrop-blur-md sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/90">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500"></div>

        @if (emailSent) {
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <i class="pi pi-envelope text-2xl"></i>
            </div>
            <h1 class="m-0 text-xl font-bold text-slate-800 dark:text-white">Check your email</h1>
            <p class="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              If an account exists for <strong>{{ email }}</strong>, we sent a 6-digit verification code. The code expires in 3 minutes.
            </p>
            <p-button [routerLink]="['/auth/reset-password']" [queryParams]="{ email: email, expiresAt: expiresAtUnix }" label="Enter verification code" icon="pi pi-arrow-right" iconPos="right" styleClass="mt-5 h-10 w-full justify-center rounded-xl"></p-button>
          </div>
        } @else {
          <div class="mb-6 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <i class="pi pi-lock text-xl"></i>
            </div>
            <h1 class="m-0 text-xl font-bold text-slate-800 dark:text-white">Forgot password?</h1>
            <p class="mb-0 mt-2 text-sm text-slate-500 dark:text-slate-400">Enter your account email and we'll send you a verification code.</p>
          </div>

          <form #forgotForm="ngForm" class="flex flex-col gap-4" (ngSubmit)="submit(forgotForm)" novalidate>
            <div class="flex flex-col gap-1.5">
              <label for="forgotEmail" class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email address</label>
              <div class="relative flex w-full items-center">
                <i class="pi pi-envelope absolute left-3.5 z-20 text-sm text-slate-400"></i>
                <input pInputText id="forgotEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" class="h-10 w-full custom-input text-xs" [(ngModel)]="email" #emailModel="ngModel" required email />
              </div>
              @if (emailModel.invalid && emailModel.touched) {
                <small class="text-xs text-red-500">Enter a valid email address.</small>
              }
            </div>

            <p-button type="submit" label="Send verification code" icon="pi pi-send" iconPos="right" [loading]="loading" styleClass="h-10 w-full justify-center rounded-xl border-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-sm font-semibold text-white dark:from-indigo-600 dark:via-indigo-700 dark:to-indigo-600"></p-button>
            <a routerLink="/auth/login" class="text-center text-xs font-semibold text-slate-500 no-underline hover:text-primary hover:underline dark:text-slate-400">Back to sign in</a>
          </form>
        }
      </section>
    </main>
  `,
})
export class ForgotPassword {
  email = '';
  loading = false;
  emailSent = false;
  expiresAtUnix = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  submit(form: NgForm): void {
    if (form.invalid || !this.email.trim()) {
      form.control.markAllAsTouched();
      return;
    }

    const normalizedEmail = this.email.trim();
    this.loading = true;

    this.authService
      .forgotPassword(normalizedEmail)
      .subscribe({
        next: (response: RootModel) => {
          if (!response.success) {
            return;
          }

          const receivedLifetime = Number(
            response.data?.expires_in_seconds
          );

          const lifetimeSeconds =
            Number.isFinite(receivedLifetime) &&
              receivedLifetime > 0
              ? receivedLifetime
              : 180;

          this.email = normalizedEmail;
          this.expiresAtUnix =
            Math.floor(Date.now() / 1000) +
            lifetimeSeconds;

          this.emailSent = true;
        },

        error: () => {
          this.loading = false;
        },

        complete: () => {
          this.loading = false;
        }
      });
  }
}
