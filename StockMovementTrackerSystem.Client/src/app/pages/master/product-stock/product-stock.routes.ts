import { Route } from '@angular/router';
import { ProductStock } from './product-stock';
import { AuditLog } from './audit-log/audit-log';

export default [
  {
    path: '',
    component: ProductStock,
    data: { title: '' },
  },
   {
    path: ':id/:productid/audit-logs',
    component: AuditLog,
    data: { title: 'Audit Logs' },
  },
] as Route;
