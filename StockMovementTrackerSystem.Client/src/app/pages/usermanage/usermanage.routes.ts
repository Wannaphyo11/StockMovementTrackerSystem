import { Routes } from '@angular/router';
import { UserManage } from './usermanage';

export default [
  {
    path: 'user-manage',
    component: UserManage,
    data: { title: '' },
  },
] as Routes;
