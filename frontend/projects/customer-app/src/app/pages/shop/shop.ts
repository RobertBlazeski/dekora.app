import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Category, ProductCategory, ProductListItem, resolveProductName } from '@dekora/shared';
import { ProductsApi } from '../../core/api/products.api';
import { CategoriesApi } from '../../core/api/categories.api';
import { ProductCard } from '../../components/product-card/product-card';
import { RevealOnScrollDirective } from '../../core/reveal/reveal-on-scroll.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-shop',
  imports: [TranslatePipe, ProductCard, RevealOnScrollDirective],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop {
  private readonly productsApi = inject(ProductsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly route = inject(ActivatedRoute);
  protected readonly translation = inject(TranslationService);

  // The owner can add categories beyond the original 5 — loaded live rather than hardcoded.
  protected readonly categories = signal<Category[]>([]);
  protected readonly occasionCategories = computed(() => this.categories().filter((c) => !c.isProductType));
  protected readonly typeCategories = computed(() => this.categories().filter((c) => c.isProductType));
  protected readonly search = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly selectedCategory = signal<ProductCategory | ''>(
    (this.route.snapshot.queryParamMap.get('category') as ProductCategory | null) ?? '',
  );
  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly loading = signal(true);
  // Matches the 4-column desktop grid so the loading state fills a full couple of rows without
  // ever looking sparse, however narrow the actual result count turns out to be.
  protected readonly skeletonCount = Array.from({ length: 8 }, (_, i) => i);

  private searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.categoriesApi.getAll().subscribe((categories) => this.categories.set(categories));

    effect(() => {
      const search = this.search();
      const category = this.selectedCategory();
      this.loading.set(true);
      this.productsApi
        .getAll({ search: search || undefined, category: category || undefined })
        .subscribe((products) => {
          this.products.set(products);
          this.loading.set(false);
        });
    });
  }

  protected onSearchInput(value: string): void {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => this.search.set(value), 300);
  }

  protected selectCategory(category: ProductCategory | ''): void {
    this.selectedCategory.set(category);
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
}
