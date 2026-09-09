import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category, HomepageContent, ProductListItem, resolveAssetUrl, resolveLocalizedText, resolveProductName } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { BusinessRulesApi } from '../../core/api/business-rules.api';
import { CategoriesApi } from '../../core/api/categories.api';
import { HomepageContentApi } from '../../core/api/homepage-content.api';
import { ProductsApi } from '../../core/api/products.api';
import { AuthService } from '../../core/auth/auth.service';
import { ProductCarousel } from '../../components/product-carousel/product-carousel';
import { RevealOnScrollDirective } from '../../core/reveal/reveal-on-scroll.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, ProductCarousel, RouterLink, RevealOnScrollDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly homepageContentApi = inject(HomepageContentApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly businessRulesApi = inject(BusinessRulesApi);
  protected readonly auth = inject(AuthService);
  protected readonly translation = inject(TranslationService);

  // Owner-editable via the admin dashboard; null until the request resolves, at which
  // point the template falls back to the translated default copy.
  protected readonly content = signal<HomepageContent | null>(null);
  protected readonly trending = signal<ProductListItem[]>([]);
  protected readonly trendingLoading = signal(true);

  protected readonly featuredProduct = computed(() => this.content()?.featuredProduct ?? null);

  protected readonly featuredProductName = computed(() => {
    const p = this.featuredProduct();
    return p ? resolveProductName(this.translation.currentLocale(), p) : '';
  });

  protected readonly featuredProductLink = computed(() => {
    const p = this.featuredProduct();
    return p ? ['/', this.translation.currentLocale(), 'product', p.id] : null;
  });

  // Falls back to the untranslated Macedonian text (or, for title/subtitle, the i18n default
  // copy) whenever the owner hasn't set a translation for the current locale.
  protected readonly displayBannerTitle = computed(() => {
    const c = this.content();
    if (!c?.bannerTitle) return this.translation.translate('home.title');
    return resolveLocalizedText(this.translation.currentLocale(), c.bannerTitle, c.bannerTitleEn, c.bannerTitleSq);
  });

  protected readonly displayBannerSubtitle = computed(() => {
    const c = this.content();
    if (!c?.bannerSubtitle) return this.translation.translate('home.subtitle');
    return resolveLocalizedText(this.translation.currentLocale(), c.bannerSubtitle, c.bannerSubtitleEn, c.bannerSubtitleSq);
  });

  protected readonly displayBannerCtaLabel = computed(() => {
    const c = this.content();
    if (!c?.bannerCtaLabel) return this.translation.translate('home.defaultCtaLabel');
    return resolveLocalizedText(this.translation.currentLocale(), c.bannerCtaLabel, c.bannerCtaLabelEn, c.bannerCtaLabelSq);
  });

  protected readonly displayPromoBannerText = computed(() => {
    const c = this.content();
    if (!c?.promoBannerText) return '';
    return resolveLocalizedText(this.translation.currentLocale(), c.promoBannerText, c.promoBannerTextEn, c.promoBannerTextSq);
  });

  // Falls back to the custom banner photo only when no product is featured.
  protected readonly heroImageUrl = computed(() => {
    const featured = this.featuredProduct();
    if (featured) return resolveAssetUrl(environment.apiUrl, featured.primaryImageUrl);
    return resolveAssetUrl(environment.apiUrl, this.content()?.bannerImageUrl ?? null);
  });

  // Ticks once a second so the countdown next to the promo strip stays live. The banner always
  // has a countdown — either the owner's own end time, or the server's rolling default cycle —
  // so this label is only ever null before the first content load.
  protected readonly promoCountdown = signal<string | null>(null);

  protected readonly promoBannerHref = computed(() => {
    const link = this.content()?.promoBannerLink?.trim();
    if (!link) return null;
    if (/^https?:\/\//i.test(link)) return link;
    return `/${this.translation.currentLocale()}${link.startsWith('/') ? link : '/' + link}`;
  });

  // The owner enters this as a plain path (e.g. "/shop"). Left as-is it would navigate to a
  // bare, locale-less URL — which the :lang route guard rejects and silently redirects to the
  // default locale, discarding whatever language the visitor was actually on. Absolute
  // (http/https) links pass through untouched in case the owner links somewhere external.
  protected readonly primaryCtaLink = computed(() => {
    const link = this.content()?.bannerCtaLink?.trim() || '/shop';
    if (/^https?:\/\//i.test(link)) return link;
    return `/${this.translation.currentLocale()}${link.startsWith('/') ? link : '/' + link}`;
  });

  // A fixed rotation of the site's accent tones — cycles round however many categories exist
  // (including ones the owner adds later) so every tile still gets a deliberate color even
  // before it has a representative product photo.
  private static readonly TILE_TONES = ['coral', 'rose', 'lilac', 'success', 'ink'];

  protected readonly categories = signal<Category[]>([]);
  protected readonly occasionTiles = computed(() => this.buildTiles(this.categories().filter((c) => !c.isProductType)));
  protected readonly typeTiles = computed(() => this.buildTiles(this.categories().filter((c) => c.isProductType)));

  private buildTiles(categories: Category[]) {
    return categories.map((category, i) => ({
      category,
      tone: Home.TILE_TONES[i % Home.TILE_TONES.length],
      imageUrl: resolveAssetUrl(environment.apiUrl, category.sampleImageUrl),
    }));
  }

  // Prefers the category's own nameEn/nameSq (settable from the admin dashboard) over the
  // original 5 categories' hardcoded i18n keys, which stay as the fallback for those five so
  // nothing regresses for categories nobody's bothered to add a translation to yet. A category
  // with neither just shows its raw name.
  protected categoryLabel(category: Category): string {
    const resolved = resolveProductName(this.translation.currentLocale(), category);
    if (resolved !== category.name) return resolved;

    const translated = this.translation.translate('categories.' + category.name);
    return translated === 'categories.' + category.name ? category.name : translated;
  }

  // Logged-in visitors already have an account — pushing "create an account" at them is dead
  // copy, so this section becomes a live points-status readout instead. Logged-out visitors
  // still see the original pitch, since the server has no way to know whether they already have
  // an account on another device.
  protected readonly pointsRedemptionMinimum = signal(300);
  protected readonly pointsRedemptionValue = signal(0.6);
  protected readonly currentPoints = computed(() => this.auth.currentUser()?.points ?? 0);
  protected readonly pointsStillNeeded = computed(() =>
    Math.max(0, this.pointsRedemptionMinimum() - this.currentPoints()),
  );
  protected readonly canRedeemPoints = computed(() => this.currentPoints() >= this.pointsRedemptionMinimum());
  protected readonly redemptionDiscountAmount = computed(() =>
    Math.round(this.pointsRedemptionMinimum() * this.pointsRedemptionValue()),
  );

  constructor() {
    this.homepageContentApi.get().subscribe((content) => this.content.set(content));
    this.productsApi.getTrending().subscribe((products) => {
      this.trending.set(products);
      this.trendingLoading.set(false);
    });
    this.categoriesApi.getAll().subscribe((categories) => this.categories.set(categories));
    this.businessRulesApi.get().subscribe((rules) => {
      this.pointsRedemptionMinimum.set(rules.pointsRedemptionMinimum);
      this.pointsRedemptionValue.set(rules.pointsRedemptionValue);
    });

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const tick = () => {
        const endsAt = this.content()?.effectivePromoBannerEndsAt;
        this.promoCountdown.set(endsAt ? formatCountdown(new Date(endsAt).getTime() - Date.now()) : null);
      };
      tick();
      const timer = setInterval(tick, 1000);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
  }
}

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
