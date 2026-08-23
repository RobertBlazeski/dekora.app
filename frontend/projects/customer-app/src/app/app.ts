import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { ConsentBanner } from './layout/consent-banner/consent-banner';
import { WishlistToast } from './components/wishlist-toast/wishlist-toast';
import { AnalyticsApi } from './core/api/analytics.api';

const VISIT_PINGED_KEY = 'dekora.visit-pinged';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ConsentBanner, WishlistToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    // Once per browser tab session, not once per page — matches "a visit" rather than "a page
    // view." Best-effort: skipped entirely on the server (no session to dedupe against there).
    if (isBrowser && !sessionStorage.getItem(VISIT_PINGED_KEY)) {
      sessionStorage.setItem(VISIT_PINGED_KEY, '1');
      inject(AnalyticsApi).recordVisit().subscribe({ error: () => {} });
    }
  }
}
