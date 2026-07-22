import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RootModel } from '../../models/master/root.model';
import { UserInfoEntryModel, UserInfoModel } from '../../models/usermanage/usermanage.model';

@Injectable({
    providedIn: 'root',
})
export class UserManageService {
    constructor(private httpClient: HttpClient) { }

    get(role: string): Observable<RootModel> {
        return this.httpClient.get<RootModel>(`${environment.main_url}/user/userinfo/get-role?role=${role}`);
    }
    checkUserName(userName: string): Observable<RootModel> {
        return this.httpClient.get<RootModel>(`${environment.main_url}/user/userinfo/by-userName?userName=${userName}`);
    }
    create(model: UserInfoEntryModel): Observable<RootModel> {
        return this.httpClient.post<RootModel>(`${environment.main_url}/user/userinfo`, model);
    }
    update(model: UserInfoModel): Observable<RootModel> {
        return this.httpClient.put<RootModel>(`${environment.main_url}/user/userinfo`, model);
    }
    resetPassword(userName: string, password: string): Observable<RootModel> {
        return this.httpClient.put<RootModel>(`${environment.main_url}/user/userinfo/reset?userName=${userName}&password=${password}`, null);
    }
    terminate(userId: string) {
        return this.httpClient.put<RootModel>(`${environment.main_url}/user/userinfo/terminate?userId=${userId}`, null);
    }
    unTerminate(userId: string) {
        return this.httpClient.put<RootModel>(`${environment.main_url}/user/userinfo/unterminate?userId=${userId}`, null);
    }
}

