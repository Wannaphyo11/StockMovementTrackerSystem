import { Routes } from '@angular/router';
import { ProductStock } from './product-stock/product-stock';

export default [
  {
    path: 'product-stock',
    component: ProductStock,
    data: { title: '' },
  },
] as Routes;
