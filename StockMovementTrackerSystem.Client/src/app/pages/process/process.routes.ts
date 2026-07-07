import { Routes } from '@angular/router';
import { AuditLog } from './product-stock-summary/audit-log/audit-log';
import { StockMovement } from './stock-movement/stock-movement';
import { ProductStockSummary } from './product-stock-summary/product-stock-summary';

export default [
  {
    path: 'stock-movement',
    component: StockMovement,
    data: { title: '' },
  },
  {
    path: 'product-stock-summary/auditlogs/:productId',
    component: AuditLog,
    data: { title: 'Audit Logs' },
  },
  { path: 'product-stock-summary',
     component: ProductStockSummary,
     data: { title: 'Product Stock Summary' },
  },
] as Routes;
