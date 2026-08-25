import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HomepageContent, ProductListItem, UpdateHomepageContentRequest, resolveAssetUrl } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { ImageUpload } from '../../components/image-upload/image-upload';
import { TranslateButton } from '../../components/translate-button/translate-button';
import { HomepageContentApi } from '../../core/api/homepage-content.api';
import { ProductsApi } from '../../core/api/products.api';

@Component({
  selector: 'app-homepage',
  imports: [FormsModule, ImageUpload, TranslateButton],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class Homepage {
  private readonly homepageContentApi = inject(HomepageContentApi);
  private readonly productsApi = inject(ProductsApi);

  protected readonly content = signal<HomepageContent>({
    bannerTitle: '',
    bannerTitleEn: null,
    bannerTitleSq: null,
    bannerSubtitle: '',
    bannerSubtitleEn: null,
    bannerSubtitleSq: null,
    bannerImageUrl: null,
    bannerCtaLabel: null,
    bannerCtaLabelEn: null,
    bannerCtaLabelSq: null,
    bannerCtaLink: null,
    promoBannerEnabled: false,
    promoBannerText: null,
    promoBannerTextEn: null,
    promoBannerTextSq: null,
    promoBannerLink: null,
    promoBannerEndsAt: null,
    effectivePromoBannerEndsAt: new Date(0).toISOString(),
    featuredProduct: null,
  });
  protected readonly featuredProductId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly showTranslations = signal(false);

  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly productSearch = signal('');
  protected readonly filteredProducts = computed(() => {
    const term = this.productSearch().toLowerCase();
    return this.products().filter((p) => this.matchesSearch(p, term));
  });

  protected readonly featuredProductSearch = signal('');
  protected readonly featuredProductResults = computed(() => {
    const term = this.featuredProductSearch().trim().toLowerCase();
    if (!term) return [];
    return this.products()
      .filter((p) => this.matchesSearch(p, term))
      .slice(0, 6);
  });

  private matchesSearch(p: ProductListItem, term: string): boolean {
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      (p.nameEn?.toLowerCase().includes(term) ?? false) ||
      (p.nameSq?.toLowerCase().includes(term) ?? false)
    );
  }

  constructor() {
    this.homepageContentApi.get().subscribe((content) => {
      this.content.set(content);
      this.featuredProductId.set(content.featuredProduct?.id ?? null);
    });
    this.loadProducts();
  }

  private loadProducts(): void {
    this.productsApi.getAll().subscribe((products) => this.products.set(products));
  }

  protected updateField<K extends keyof HomepageContent>(field: K, value: HomepageContent[K]): void {
    this.content.update((c) => ({ ...c, [field]: value }));
  }

  protected pickFeaturedProduct(product: ProductListItem): void {
    this.featuredProductId.set(product.id);
    this.featuredProductSearch.set('');
    this.content.update((c) => ({
      ...c,
      featuredProduct: {
        id: product.id,
        name: product.name,
        nameEn: product.nameEn,
        nameSq: product.nameSq,
        primaryImageUrl: product.primaryImageUrl,
        lowestPrice: product.lowestPrice,
      },
    }));
  }

  protected clearFeaturedProduct(): void {
    this.featuredProductId.set(null);
    this.content.update((c) => ({ ...c, featuredProduct: null }));
  }

  protected save(): void {
    this.saving.set(true);
    this.saved.set(false);

    const c = this.content();
    const request: UpdateHomepageContentRequest = {
      bannerTitle: c.bannerTitle,
      bannerTitleEn: c.bannerTitleEn,
      bannerTitleSq: c.bannerTitleSq,
      bannerSubtitle: c.bannerSubtitle,
      bannerSubtitleEn: c.bannerSubtitleEn,
      bannerSubtitleSq: c.bannerSubtitleSq,
      bannerImageUrl: c.bannerImageUrl,
      bannerCtaLabel: c.bannerCtaLabel,
      bannerCtaLabelEn: c.bannerCtaLabelEn,
      bannerCtaLabelSq: c.bannerCtaLabelSq,
      bannerCtaLink: c.bannerCtaLink,
      promoBannerEnabled: c.promoBannerEnabled,
      promoBannerText: c.promoBannerText,
      promoBannerTextEn: c.promoBannerTextEn,
      promoBannerTextSq: c.promoBannerTextSq,
      promoBannerLink: c.promoBannerLink,
      promoBannerEndsAt: c.promoBannerEndsAt,
      featuredProductId: this.featuredProductId(),
    };

    this.homepageContentApi.update(request).subscribe((updated) => {
      this.content.set(updated);
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    });
  }

  protected toggleTrending(product: ProductListItem): void {
    this.productsApi.setTrending(product.id, !product.isTrending, null).subscribe(() => this.loadProducts());
  }

  protected resolveUrl(url: string | null): string | null {
    return resolveAssetUrl(environment.apiUrl, url);
  }

  // <input type="datetime-local"> needs "yyyy-MM-ddTHH:mm" in local time, not an ISO UTC string.
  protected get promoBannerEndsAtLocal(): string {
    const iso = this.content().promoBannerEndsAt;
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  protected setPromoBannerEndsAtLocal(value: string): void {
    const iso = value ? new Date(value).toISOString() : null;
    this.updateField('promoBannerEndsAt', iso);
  }
}
