import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SharedService } from '../../shared/services/shared.service';
import { RootModel } from '../../core/models/master/root.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  constructor(
    private sharedService: SharedService,
    private authService: AuthService,
    private cookieService: CookieService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.redirectToRelatedRoute();
    }, 1500);
  }

  redirectToRelatedRoute(): void {
    const rememberMe: string = window.localStorage.getItem('remember-me') ?? '';

    if (this.authService.isHasToken() && rememberMe == 'remember') {
      this.authService.refreshToken().subscribe({
        next: (res: any) => {
          this.setValueToSession(res);

          this.router.navigate(['/dashboard']);
        },
        error: (error: any) => {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        },
      });
    } else this.router.navigate(['/auth/login']);
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
