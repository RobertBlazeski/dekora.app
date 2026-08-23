import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

const STORAGE_KEY = 'dekora.consent-acknowledged';

// Shown once per browser on first visit — a plain acknowledgement of the site's policies
// (delivery/payment/no-refund terms, what we store), not a cookie-consent/opt-out control,
// since we don't use third-party tracking cookies (see privacy policy). Dismissing it just
// records that the visitor has seen it; it never blocks browsing.
@Component({
  selector: 'app-consent-banner',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './consent-banner.html',
  styleUrl: './consent-banner.scss',
})
export class ConsentBanner {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly translation = inject(TranslationService);

  protected readonly visible = signal(this.isBrowser && !localStorage.getItem(STORAGE_KEY));

  protected acknowledge(): void {
    this.visible.set(false);
    if (this.isBrowser) localStorage.setItem(STORAGE_KEY, '1');
  }
}
