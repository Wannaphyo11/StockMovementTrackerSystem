import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RootModel } from '../../models/master/root.model';
import { ProductStockModel } from '../../models/master/stock-movement.model';

@Injectable({
  providedIn: 'root',
})
export class ProductStockService {
  constructor(private httpClient: HttpClient) { }

  get(): Observable<RootModel> {
    return this.httpClient.get<RootModel>(`${environment.main_url}/stocksmovement`);
  }
  getAuditLog(productId: string): Observable<RootModel> {
    return this.httpClient.get<RootModel>(
      `${environment.main_url}/stocksmovement/auditlogs?productId=${encodeURIComponent(productId)}`,
    );
  }
  create(model: ProductStockModel): Observable<RootModel> {
    return this.httpClient.post<RootModel>(`${environment.main_url}/stocksmovement/stock`, model);
  }
}
