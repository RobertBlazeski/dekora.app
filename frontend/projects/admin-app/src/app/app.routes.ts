import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

// This app is intended to be deployed under its own protected area (e.g. an /admin/
// base path or subdomain) per the handoff spec — routes below are relative to that root.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview) },
      { path: 'analytics', loadComponent: () => import('./pages/analytics/analytics').then((m) => m.Analytics) },
      { path: 'orders', loadComponent: () => import('./pages/orders/orders').then((m) => m.Orders) },
      { path: 'products', loadComponent: () => import('./pages/products/products').then((m) => m.Products) },
      { path: 'homepage', loadComponent: () => import('./pages/homepage/homepage').then((m) => m.Homepage) },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers').then((m) => m.Customers) },
      { path: 'reviews', loadComponent: () => import('./pages/reviews/reviews').then((m) => m.Reviews) },
      { path: 'faq', loadComponent: () => import('./pages/faq/faq').then((m) => m.Faq) },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications').then((m) => m.Notifications),
      },
      { path: '**', redirectTo: 'overview' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
