import { Routes } from '@angular/router';
import { AuditLog } from './stock-movement/audit-log/audit-log';
import { StockMovement } from './stock-movement/stock-movement';

export default [
  {
    path: 'stock-movement',
    component: StockMovement,
    data: { title: '' },
  },
  {
    path: 'stock-movement/auditlogs/:productId',
    component: AuditLog,
    data: { title: 'Audit Logs' },
  },
] as Routes;
