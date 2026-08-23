import { Routes } from '@angular/router';
import { DEFAULT_LOCALE } from './i18n/locale';
import { localeGuard } from './i18n/locale.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: DEFAULT_LOCALE },
  {
    path: ':lang',
    canActivate: [localeGuard],
    // Without this, switching from /mk/shop to /en/shop wouldn't re-run the guard (only the
    // child route changes by default) and the locale would silently fail to update.
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
      { path: 'shop', loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop) },
      {
        path: 'product/:id',
        loadComponent: () => import('./pages/product-detail/product-detail').then((m) => m.ProductDetail),
      },
      { path: 'cart', loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart) },
      { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout) },
      { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
      { path: 'signup', loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup) },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile) },
      { path: 'wishlist', loadComponent: () => import('./pages/wishlist/wishlist').then((m) => m.Wishlist) },
      { path: 'faq', loadComponent: () => import('./pages/faq/faq').then((m) => m.Faq) },
      {
        path: 'terms',
        loadComponent: () => import('./pages/legal/legal-page/legal-page').then((m) => m.LegalPage),
        data: { doc: 'terms' },
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/legal/legal-page/legal-page').then((m) => m.LegalPage),
        data: { doc: 'privacy' },
      },
      {
        path: 'refund-policy',
        loadComponent: () => import('./pages/legal/legal-page/legal-page').then((m) => m.LegalPage),
        data: { doc: 'refund' },
      },
      { path: '**', redirectTo: '' },
    ],
  },
  { path: '**', redirectTo: DEFAULT_LOCALE },
];
