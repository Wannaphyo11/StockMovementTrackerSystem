// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { RootModel } from '@core_models/root.model';
// import { Observable } from 'rxjs';
// import { NotificationEntryModel, NotificationRequestModel } from '../models/notification.model';
// import {LoggerService} from '../../shared/services/logger.service';
// import { environment } from '../../../environments/environment';

// @Injectable({
//   providedIn: 'root'
// })
// export class NotificationService {

//   constructor(private http: HttpClient, private logger: LoggerService) {

//   }

//   entry(notification: NotificationEntryModel): Observable<RootModel> {
//     let url: string = `${environment.auth_url}/notification/entry`;
//     return this.http.post<RootModel>(url, JSON.stringify(notification));
//   }

//   specific(body: NotificationRequestModel): Observable<RootModel> {
//     let url: string = `${environment.auth_url}/notification/specific`;
//     return this.http.post<RootModel>(url, JSON.stringify(body));
//   }
// }
