import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoggerService } from '../../shared/services/logger.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/master/root.model';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private logger: LoggerService,
    private cookieService: CookieService,
  ) {}

  // getUser(phone: string): Observable<RootModel> {
  //   let url: string = `${environment.auth_url}/get-user?phone=${phone}`;
  //   return this.http.get<RootModel>(url);
  // }

  status(): Observable<RootModel> {
    let url: string = `${environment.auth_url}/status`;
    return this.http.get<RootModel>(url);
  }

  accessToken(username: string, password: string): Observable<RootModel> {
    let url: string = `${environment.auth_url}/login`;
    const body = {
      userName: username,
      password: password,
    };
    return this.http.post<RootModel>(url, JSON.stringify(body));
  }

  refreshToken(): Observable<RootModel> {
    let url: string = `${environment.auth_url}/refresh-token`;
    const body = {
      access_token: window.localStorage.getItem('access_token'),
      refresh_token: window.localStorage.getItem('refresh_token'),
    };
    return this.http.post<RootModel>(url, JSON.stringify(body));
  }

  isHasToken(): boolean {
    return (
      window.localStorage.getItem('refresh_token') !== undefined &&
      window.localStorage.getItem('refresh_token') !== null &&
      window.localStorage.getItem('refresh_token') !== ''
    );
  }

  isLoggedIn(): boolean {
    return (
      this.cookieService.get('authorized_status') !== undefined &&
      this.cookieService.get('authorized_status') !== null &&
      this.cookieService.get('authorized_status') !== ''
    );
  }

  logout(): void {
    this.cookieService.delete('authorized_status', '');
  }

  logoutForce(): void {
    this.cookieService.delete('authorized_status', '');
    this.cookieService.delete('username');
    this.cookieService.delete('userrole');
    this.cookieService.delete('userId');

    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');

    window.localStorage.removeItem('default_company');
    window.localStorage.removeItem('default_branch');
  }
}
