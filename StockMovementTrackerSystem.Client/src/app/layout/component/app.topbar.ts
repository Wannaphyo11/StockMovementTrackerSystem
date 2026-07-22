import { Component, inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { LayoutService } from '../service/layout.service';
import { TranslateService } from '@ngx-translate/core';
import { PopoverModule } from 'primeng/popover';
import { AppFloatingConfigurator } from './app.floatingconfigurator';
import { BreadCrumb } from '../../shared/components/bread-crumb/bread-crumb';
import { SharedService } from '../../shared/services/shared.service';
import { AuthService } from '../../core/services/auth.service';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    TieredMenuModule,
    PopoverModule,
    BreadCrumb,
    AppFloatingConfigurator,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    PasswordModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="layout-topbar bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/50 relative">

      <!-- Gradient accent line at bottom -->
      <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-500 via-violet-500 to-indigo-500"></div>

      <!-- Logo + hamburger -->
      <div class="layout-topbar-logo-container">
        <button
          class="layout-menu-button layout-topbar-action !rounded-xl hover:!bg-slate-100 dark:hover:!bg-slate-800 transition-colors"
          (click)="layoutService.onMenuToggle()"
        >
          <i class="pi pi-bars text-slate-600 dark:text-slate-300"></i>
        </button>
        <a class="layout-topbar-logo font-bold flex items-center gap-2.5 no-underline" routerLink="/">
          <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <i class="pi pi-box text-white text-sm"></i>
          </span>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide">Stock Tracker</span>
            <span class="text-[10px] text-slate-400 dark:text-slate-500">Movement System</span>
          </div>
        </a>
      </div>

      <!-- Breadcrumb -->
      <div class="layout-topbar-breadcrumbs">
        <app-bread-crumb></app-bread-crumb>
      </div>

      <!-- Centre nav pills (desktop) -->
      <nav class="layout-topbar-module-menu xl:mx-auto xl:flex hidden items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl px-1.5 py-1.5">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="nav-pill-active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            class="nav-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            <i [class]="item.icon + ' text-xs'"></i>
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- Actions -->
      <div class="layout-topbar-actions">

        <!-- Dark mode toggle -->
        <div class="layout-config-menu">
          <button
            type="button"
            class="layout-topbar-action !rounded-xl hover:!bg-slate-100 dark:hover:!bg-slate-800 transition-all duration-200"
            (click)="toggleDarkMode()"
            title="Toggle dark mode"
          >
            <span class="inline-flex transition-transform duration-500"
              [class.rotate-180]="!layoutService.isDarkTheme()"
              [class.rotate-0]="layoutService.isDarkTheme()">
              <i [ngClass]="layoutService.isDarkTheme() ? 'pi pi-moon text-violet-400' : 'pi pi-sun text-amber-500'"></i>
            </span>
          </button>
        </div>

        <!-- Mobile overflow button -->
        <button
          class="layout-topbar-menu-button layout-topbar-action !rounded-xl hover:!bg-slate-100 dark:hover:!bg-slate-800"
          pStyleClass="@next"
          enterFromClass="hidden"
          enterActiveClass="animate-scalein"
          leaveToClass="hidden"
          leaveActiveClass="animate-fadeout"
          [hideOnOutsideClick]="true"
        >
          <i class="pi pi-ellipsis-v text-slate-600 dark:text-slate-300"></i>
        </button>

        <!-- Desktop right-side menu -->
        <div class="layout-topbar-menu hidden lg:block">
          <div class="layout-topbar-menu-content">

            <!-- Mobile nav items (small screens only) -->
            @for (item of navItems; track item.route) {
              <a
                class="layout-topbar-action layout-topar-module-menu-action !rounded-xl hover:!bg-slate-100 dark:hover:!bg-slate-800"
                [routerLink]="item.route">
                <i [class]="item.icon"></i>
                <span>{{ item.label }}</span>
              </a>
            }

            <!-- User avatar button -->
            <button
              type="button"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              (click)="opToggle($event)"
            >
              <span
                class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
              >{{ userInitials }}</span>
              <span class="hidden xl:block text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-32 truncate">{{ userName }}</span>
              <i class="pi pi-chevron-down text-xs text-slate-400"></i>
            </button>

            <!-- Profile popover -->
            <p-popover #op>
              <div class="flex flex-col gap-3 min-w-64">

                <!-- User info -->
                <div class="flex items-center gap-3 px-1 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <span class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow">
                    {{ userInitials }}
                  </span>
                  <div class="flex flex-col leading-tight">
                    <span class="font-semibold text-slate-800 dark:text-slate-100 text-sm">{{ userName }}</span>
                    <span class="text-xs text-slate-400 dark:text-slate-500 capitalize">{{ userRole }}</span>
                  </div>
                </div>

                <!-- Language switcher -->
                <div class="flex flex-col gap-1">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 mb-1">Language</p>
                  <button
                    type="button"
                    class="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                    (click)="switchLanguage('en')"
                  >
                    <img src="assets/flags/en.svg" alt="EN" class="w-5 h-5 rounded-sm" />
                    English
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                    (click)="switchLanguage('mm')"
                  >
                    <img src="assets/flags/mm.svg" alt="MM" class="w-5 h-5 rounded-sm" />
                    မြန်မာ
                  </button>
                </div>

                <!-- Actions (settings, logout) -->
                <div class="border-t border-slate-100 dark:border-slate-700 pt-2">
                  <p-tieredmenu #menu [model]="items" />
                </div>

              </div>
            </p-popover>
          </div>
        </div>
      </div>
    </div>

<p-dialog header="Change password" [visible]="isPasswordDialogVisible" [modal]="true" appendTo="body"
  [draggable]="false" [resizable]="false" [closable]="!isPasswordSubmitting" [style]="{ width: '30rem' }"
  [breakpoints]="{ '575px': '92vw' }" maskStyleClass="backdrop-blur-sm" (onHide)="onResetPasswordDialogHide()">
  <form [formGroup]="resetPasswordForm" class="flex flex-col gap-5 pt-1" (ngSubmit)="confirmResetPassword()">
    <div
      class="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
      <i class="pi pi-key mr-2"></i>Set a new password for <strong>{{ userName }}</strong>.
    </div>
    <div class="flex flex-col gap-2">
      <label for="currentPassword" class="field-label">Current password <span class="text-red-500">*</span></label>
      <p-password inputId="currentPassword" formControlName="oldPassword" styleClass="w-full" inputStyleClass="w-full"
        placeholder="Enter current password" autocomplete="current-password" [toggleMask]="true"
        [feedback]="false"></p-password>
      @if (resetPasswordForm.controls.oldPassword.touched &&
      resetPasswordForm.controls.oldPassword.hasError('required')) { <small class="text-xs text-red-500">Current
        password is required.</small> }
    </div>
    <div class="flex flex-col gap-2">
      <label for="newPassword" class="field-label">New password <span class="text-red-500">*</span></label>
      <p-password inputId="newPassword" formControlName="newPassword" styleClass="w-full" inputStyleClass="w-full"
        placeholder="Enter new password" autocomplete="new-password" [toggleMask]="true" [feedback]="true"></p-password>
      @if (resetPasswordForm.controls.newPassword.touched &&
      resetPasswordForm.controls.newPassword.hasError('required')) { <small class="text-xs text-red-500">New password is
        required.</small> }
    </div>
    <div class="flex flex-col gap-2">
      <label for="confirmPassword" class="field-label">Confirm new password <span class="text-red-500">*</span></label>
      <p-password inputId="confirmPassword" formControlName="confirmPassword" styleClass="w-full"
        inputStyleClass="w-full" placeholder="Re-enter new password" autocomplete="new-password" [toggleMask]="true"
        [feedback]="false"></p-password>
      @if (resetPasswordForm.controls.confirmPassword.touched &&
      resetPasswordForm.controls.confirmPassword.hasError('required')) { <small class="text-xs text-red-500">Please
        confirm the new password.</small> }
      @if (resetPasswordForm.controls.confirmPassword.touched && resetPasswordForm.hasError('passwordMismatch')) {
      <small class="text-xs text-red-500">Passwords do not match.</small> }
    </div>
    <div
      class="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
      <p-button label="Cancel" severity="secondary" type="button" [outlined]="true"
        [disabled]="isPasswordSubmitting" (onClick)="onResetPasswordDialogHide()"></p-button>
      <p-button type="submit" label="Change password" icon="pi pi-key"
        [loading]="isPasswordSubmitting"></p-button>
    </div>
  </form>
</p-dialog>

<p-confirmdialog key="resetPasswordDialog" appendTo="body"></p-confirmdialog>
<p-confirmdialog appendTo="body" [style]="{ width: '30rem' }" [breakpoints]="{ '768px': '90vw' }"
  rejectButtonStyleClass="p-button-outlined"></p-confirmdialog>
    <div class="hidden">
      <app-floating-configurator></app-floating-configurator>
    </div>
  `,
  styles: [
    `
      .layout-topar-module-menu-action {
        display: none !important;
      }

      @media (max-width: 1000px) {
        .layout-topar-module-menu-action {
          display: inline-flex !important;
        }
      }

      /* Active nav pill */
      ::ng-deep .nav-pill-active {
        background-color: white !important;
        color: var(--p-primary-color) !important;
        font-weight: 600 !important;
        box-shadow: 0 1px 4px rgba(0,0,0,0.10) !important;
      }

      :host-context(.app-dark) ::ng-deep .nav-pill-active {
        background-color: rgb(51 65 85) !important; /* slate-700 */
        color: var(--p-primary-color) !important;
      }
    `
  ]
})
export class AppTopbar implements OnInit {
  @ViewChild('op') op!: any;

  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  items!: MenuItem[];
  isPasswordDialogVisible = false;
  isPasswordSubmitting = false;
  userName: string | null = 'N/A';
  userRole: string | null = 'N/A';
  ADMIN: string[] = ['admin'];
  Cashier: string[] = ['cashier'];
  ALL_ROLES: string[] = ['admin', 'cashier'];


  /** Internal navigation items — all route within this Angular app */
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-pie', route: '/dashboard', roles: this.ALL_ROLES },
    { label: 'Product Stock', icon: 'pi pi-box', route: '/master/product-stock', roles: this.ADMIN },
    { label: 'Stock Movement', icon: 'pi pi-arrow-right-arrow-left', route: '/process/stock-movement', roles: this.ALL_ROLES },
    { label: 'User Information', icon: 'pi pi-list', route: '/user/user-manage', roles: this.ADMIN },
  ];

  get userInitials(): string {
    if (!this.userName || this.userName === 'N/A') return '?';
    return this.userName
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  constructor(
    private renderer: Renderer2,
    public layoutService: LayoutService,
    private sharedService: SharedService,
    private authServices: AuthService,
    private translateService: TranslateService,
    private router: Router
  ) {}

  resetPasswordForm = this.formBuilder.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordsMatchValidator });



  ngOnInit(): void {
    this.userName = this.sharedService.getUserName();
    this.userRole = this.sharedService.getUserRole();
    const userRoles = (this.userRole || '').split(',').map((role) => role.trim().toLowerCase());
    this.navItems = this.navItems.filter((item) => item.roles.some((role) => userRoles.includes(role.toLowerCase())));
    const lang = window.localStorage.getItem('lang') || 'en';
    this.switchLanguage(lang);

    this.items = [
      { label: 'Settings', icon: 'pi pi-cog' },
      {
        label: 'New Password',
        icon: 'pi pi-key',
        command: () => this.openResetPasswordDialog()
      },
      { separator: true },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
          this.authServices.logoutForce();
          this.router.navigate(['/auth/login']);
        }
      }
      // {
      //   label: 'Logout',
      //   icon: 'pi pi-sign-out',
      //   command: () => {
      //     this.router.navigate(['/auth/login']);
      //   }
      // }
    ];
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  // Reset Password Dialog
  openResetPasswordDialog(): void {
    this.resetPasswordForm.reset();
    this.isPasswordDialogVisible = true;
    this.op?.hide();
  }


  // Reset Password Dialog Confirm
  confirmResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.confirmationService.confirm({
      key: 'resetPasswordDialog',
      message: `Are you sure you want to change the password for ${this.userName}?`,
      header: 'Change Password Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const userName = this.userName;
        const { oldPassword, newPassword, confirmPassword } = this.resetPasswordForm.getRawValue();

        if (userName && oldPassword && newPassword && confirmPassword) {
          this.isPasswordSubmitting = true;
          this.authServices.changePassword(userName, oldPassword, newPassword, confirmPassword).subscribe({
            next: (response) => {
              this.isPasswordSubmitting = false;
              this.isPasswordDialogVisible = false;
              this.resetPasswordForm.reset();
              this.messageService.add({
                key: 'globalMessage',
                severity: 'success',
                summary: 'Success',
                detail: response.message?.en || response.message || 'Password changed successfully.'
              });
            },
            error: () => {
              this.isPasswordSubmitting = false;
            }
          });
        }
      }
    });
  }

  onResetPasswordDialogHide(): void {
    if (this.isPasswordSubmitting) return;

    this.isPasswordDialogVisible = false;
    this.resetPasswordForm.reset();
  }

  switchLanguage(lang: string) {
    this.translateService.use(lang);
    window.localStorage.setItem('lang', lang);
    this.setHtmlLang(lang);
  }

  opToggle(event: Event) {
    this.op.toggle(event);
  }

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme
    }));
  }

  setHtmlLang(lang: string) {
    this.renderer.setAttribute(document.documentElement, 'lang', lang);
  }
}
