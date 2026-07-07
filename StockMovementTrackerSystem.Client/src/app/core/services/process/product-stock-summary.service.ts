import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RootModel } from '../../models/master/root.model';

@Injectable({
  providedIn: 'root',
})
export class ProductStockSummaryService {
  constructor(private httpClient: HttpClient) { }

  get(): Observable<RootModel> {
    return this.httpClient.get<RootModel>(`${environment.main_url}/process/productstocksummary`);
  }
  getAuditLog(productId: string): Observable<RootModel> {
    return this.httpClient.get<RootModel>(
      `${environment.main_url}/process/productstocksummary/auditlogs?productId=${productId}`,
    );
  }
}
