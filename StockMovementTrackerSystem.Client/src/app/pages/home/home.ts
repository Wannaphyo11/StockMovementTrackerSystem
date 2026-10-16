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
