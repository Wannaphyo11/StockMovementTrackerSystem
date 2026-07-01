import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor(private http: HttpClient, private cookieService: CookieService) { }

  //#region HospitalId

  setDefaultHospitalId(value: string): void {
    this.cookieService.set('default_hospital', value);
  }

  getDefaultHospitalId(): string | null {
    return this.cookieService.get('default_hospital');
  }

  //#region UserId

  setUserId(value: string): void {
    this.cookieService.set('userId', value);
  }

  getUserId(): string | null {
    return this.cookieService.get('userId');
  }

  //#endregion

  //#region UserName

  setUserName(value: string): void {
    this.cookieService.set('username', value);
  }

  getUserName(): string | null {
    return this.cookieService.get('username');
  }

  //#endregion

  //#region UserRole

  setUserRole(value: string): void {
    this.cookieService.set('userrole', value);
  }

  getUserRole(): string | null {
    return this.cookieService.get('userrole');
  }

  //#endregion

  //#region Notification Token

  setNotificationToken(value: string): void {
    localStorage.setItem('notification_token', value);
  }

  getNotificationToken(): string | null {
    return localStorage.getItem('notification_token ');
  }

  //#endregion

  //#region Notification UserId Lists

  setUserId_Noti(value: string[]): void {
    sessionStorage.setItem('userid_list', JSON.stringify(value));
  }

  getUserId_Noti(): string[] | null {
    const storedValue = sessionStorage.getItem('userid_list');
    return storedValue ? JSON.parse(storedValue) : null;
  }

  deleteUserId_Noti(): void {
    sessionStorage.removeItem('userid_list');
  }

  //#endregion

  //#region Campaign Shops

  setCampaignShops(value: string): void {
    sessionStorage.setItem('campaign_shop', value);
  }

  getCampaignShops(): string | null {
    return sessionStorage.getItem('campaign_shop');
  }

  //#endregion

  getIPAddress() {
    return this.http.get("https://api.ipify.org/?format=json");
  }

  convertBase64(file: File): Observable<string> {
    const result = new ReplaySubject<string>(1);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      result.next((event?.target?.result ?? "").toString().split(',')[1]);
    };
    return result;
  }

  //#region Date Format

  formatDate(date: any) {
    const dateObject = new Date(date);

    // Extract the date parts
    const year = dateObject.getFullYear();
    const month = ('0' + (dateObject.getMonth() + 1)).slice(-2); // Months are zero-indexed, so add 1
    const day = ('0' + dateObject.getDate()).slice(-2);

    // Format the date as YYYY-MM-DD
    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
  }

  getRoundedHour(date: Date): Date {
    const newDate = new Date(date);
    const minutes = newDate.getMinutes();

    // if (newDate.getMinutes() > 0) {
    //   newDate.setHours(newDate.getHours() + 1);  // Increment the hour by 1
    // }

    // Always set minutes, seconds, and milliseconds to zero
    newDate.setMinutes(0);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    if (minutes >= 50) {
      // If current minutes are between 50-59, add two hours
      newDate.setHours(newDate.getHours() + 2);
    } else {
      // If current minutes are between 0-49, add one hour
      newDate.setHours(newDate.getHours() + 1);
    }

    return newDate;
  }

  //#endregion

  // convertBase64(file: File): Observable<string> {
  //   return new Observable(observer => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => {
  //       observer.next(reader.result as string);
  //       observer.complete();
  //     };
  //     reader.onerror = error => {
  //       observer.error(error);
  //     };
  //   });
  // }
}
