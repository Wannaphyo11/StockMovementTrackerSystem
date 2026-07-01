import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { CookieService } from 'ngx-cookie-service';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { SharedService } from '../../shared/services/shared.service';
import { RootModel } from '../../core/models/master/root.model';
import { environment } from '../../../environments/environment';

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
    AppFloatingConfigurator,
    TranslatePipe,
  ],
  template: `
    <app-floating-configurator></app-floating-configurator>
    <div class="flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="">
          <div
            class="w-full bg-surface-0 dark:bg-surface-900 py-10 px-4 sm:px-10 border border-gray-200 shadow-lg"
            style="border-radius: 15px"
          >
            <div class="text-center mb-8">
              <div class="text-surface-700 dark:text-surface-0 text-3xl font-bold mb-4">
                PRODUCT STOCK TRACKER
              </div>
              <span class="text-muted-color font-medium">{{
                'SIGN_IN_TO_CONTINUE' | translate
              }}</span>
            </div>
            <div>
              <label
                for="username1"
                class="block text-surface-900 dark:text-surface-0 text-base font-medium mb-2"
                >{{ 'EMAIL_OR_USERNAME' | translate }}</label
              >
              <input
                pInputText
                id="username1"
                type="text"
                placeholder="Email address"
                class="w-full md:w-96 mb-8"
                [(ngModel)]="username"
              />
              <label
                for="password1"
                class="block text-surface-900 dark:text-surface-0 font-medium text-base mb-2"
              >
                {{ 'PASSWORD' | translate }}
              </label>
              <p-password
                id="password1"
                [(ngModel)]="password"
                placeholder="Password"
                [toggleMask]="true"
                class="mb-4"
                [fluid]="true"
                [feedback]="false"
              ></p-password>
              <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                <div class="flex items-center">
                  <p-checkbox
                    [(ngModel)]="isRemberMeChecked"
                    id="rememberme1"
                    binary
                    class="mr-2"
                    (change)="rememberMeChange($event)"
                  ></p-checkbox>
                  <label for="rememberme1">{{ 'REMEMBER_ME' | translate }}</label>
                </div>
                <span
                  class="font-medium no-underline ml-2 text-right cursor-pointer text-primary"
                  >{{ 'FORGOT_PASSWORD' | translate }}</span
                >
              </div>
              <p-button
                label="Sign In"
                styleClass="w-full"
                (onClick)="login()"
                [loading]="loading"
              ></p-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Login implements OnInit {
  isRemberMeChecked: boolean = false;

  username!: string;
  password!: string;

  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private sharedService: SharedService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (window.localStorage.getItem('remember-me') === 'remember') {
      this.isRemberMeChecked = true;
    }
  }

  rememberMeChange(event: any): void {
    this.isRemberMeChecked = event.target.checked;
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
