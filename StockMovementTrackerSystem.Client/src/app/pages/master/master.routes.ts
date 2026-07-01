import { Routes } from '@angular/router';

export default [
  {
    path: 'product-stock',
    loadChildren: () => import('./product-stock/product-stock.routes'),
  },
  // { path: 'service-type', loadChildren: () => import('./service-type/service-type.routes') },
  // {
  //   path: 'storage-fee-policies',
  //   loadChildren: () => import('./storagefee-policies/storagefee-policies.routes'),
  // },
  // { path: 'formula-output', loadChildren: () => import('./formula-output/formula-output.routes') },
  // {
  //   path: 'formula-component',
  //   loadChildren: () => import('./formula-component/formula-component.routes'),
  // },
  // { path: 'warehouse', loadChildren: () => import('./warehouse/warehouse.routes') },
  // { path: 'formula-output', loadChildren: () => import('./formula-output/formula-output.routes') },
  // { path: 'formula', loadChildren: () => import('./formula/formula.routes') },
] as Routes;
