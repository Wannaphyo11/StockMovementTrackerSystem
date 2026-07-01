// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { RootModel } from '@core_models/root.model';
// import { environment } from '@env/environment';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root',
// })
// export class StockDropDownService {
//   constructor(private httpClient: HttpClient) {}

//   getStockItems(): Observable<RootModel> {
//     return this.httpClient.get<RootModel>(`${environment.stock_url}/stockitem`);
//   }

//   getStockFormulaId(formulaId: string): Observable<RootModel> {
//     return this.httpClient.get<RootModel>(`${environment.stock_url}/stockitem/${formulaId}`);
//   }

//   getStockFormula(): Observable<RootModel> {
//     return this.httpClient.get<RootModel>(`${environment.stock_url}/stockformula`);
//   }
// }
