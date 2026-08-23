import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Live data — render on each request so the owner-edited banner, trending picks, search
  // results and sold-out state are never stale, while still returning real HTML to crawlers.
  // Home used to be static/prerendered, but now pulls the homepage banner + trending rail
  // from the API, so it needs the same per-request treatment as shop/product pages. FAQ and the
  // legal pages moved here too once they started embedding the admin-editable contact email/
  // phone (see legal-page.ts) instead of a fixed placeholder.
  { path: ':lang', renderMode: RenderMode.Server },
  { path: ':lang/shop', renderMode: RenderMode.Server },
  { path: ':lang/product/:id', renderMode: RenderMode.Server },
  { path: ':lang/faq', renderMode: RenderMode.Server },
  { path: ':lang/terms', renderMode: RenderMode.Server },
  { path: ':lang/privacy', renderMode: RenderMode.Server },
  { path: ':lang/refund-policy', renderMode: RenderMode.Server },

  // Client-only state (cart contents, auth session) or forms with no SEO value — no benefit
  // to rendering these on the server, so ship them as a plain client-rendered SPA route.
  { path: ':lang/cart', renderMode: RenderMode.Client },
  { path: ':lang/checkout', renderMode: RenderMode.Client },
  { path: ':lang/login', renderMode: RenderMode.Client },
  { path: ':lang/signup', renderMode: RenderMode.Client },
  { path: ':lang/forgot-password', renderMode: RenderMode.Client },
  { path: ':lang/reset-password', renderMode: RenderMode.Client },
  { path: ':lang/profile', renderMode: RenderMode.Client },
  { path: ':lang/wishlist', renderMode: RenderMode.Client },

  { path: '**', renderMode: RenderMode.Server },
];
