import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RootModel } from '../../models/master/root.model';
import { StockMovementModel } from '../../models/master/stock-movement.model';

@Injectable({
  providedIn: 'root',
})
export class StockMovementService {
  constructor(private httpClient: HttpClient) { }

  get(): Observable<RootModel> {
    return this.httpClient.get<RootModel>(`${environment.main_url}/process/stocksmovement`);
  }
  getAuditLog(productId: string): Observable<RootModel> {
    return this.httpClient.get<RootModel>(
      `${environment.main_url}/process/stocksmovement/auditlogs?productId=${productId}`,
    );
  }
  create(model: StockMovementModel): Observable<RootModel> {
    return this.httpClient.post<RootModel>(`${environment.main_url}/process/stocksmovement/stock`, model);
  }
  update(movementId: string, model: StockMovementModel): Observable<RootModel> {
    return this.httpClient.put<RootModel>(`${environment.main_url}/process/stocksmovement/update-stockmove?movementId=${movementId}`, model);
  }

}
