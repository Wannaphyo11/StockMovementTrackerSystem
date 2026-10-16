import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Home } from './app/pages/home/home';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { AuthGuardService } from './app/shared/services/auth-guard.service';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [AuthGuardService],
      },
      {
        path: 'master',
        loadChildren: () => import('./app/pages/master/master.routes'),
        canActivate: [AuthGuardService],
      },
      {
        path: 'process',
        loadChildren: () => import('./app/pages/process/process.routes'),
        canActivate: [AuthGuardService],
      },
      {
        path: 'user',
        loadChildren: () => import('./app/pages/usermanage/usermanage.routes'),
        canActivate: [AuthGuardService],
      },
      {
        path: 'chat',
        loadComponent: () => import('./app/pages/chat/chat').then((m) => m.Chat),
        canActivate: [AuthGuardService],
      },
    ],
  },
];
