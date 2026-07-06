import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RootModel } from '../../models/master/root.model';
import { ProductStocksModel } from '../../models/master/stock-movement.model';

@Injectable({
    providedIn: 'root',
})
export class ProductStockService {
    constructor(private httpClient: HttpClient) { }

    get(): Observable<RootModel> {
        return this.httpClient.get<RootModel>(`${environment.main_url}/master/productstocks`);
    }

    create(model: ProductStocksModel): Observable<RootModel> {
        return this.httpClient.post<RootModel>(`${environment.main_url}/master/productstocks/product`, model);
    }
    update(productId: string, model: ProductStocksModel): Observable<RootModel> {
        return this.httpClient.put<RootModel>(`${environment.main_url}/master/productstocks/update?productId=${productId}`, model);
    }
}
