import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Category, ProductCategory, ProductListItem } from '@dekora/shared';
import { ProductsApi } from '../../core/api/products.api';
import { CategoriesApi } from '../../core/api/categories.api';
import { ProductCard } from '../../components/product-card/product-card';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-shop',
  imports: [TranslatePipe, ProductCard],
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
  protected readonly search = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly selectedCategory = signal<ProductCategory | ''>(
    (this.route.snapshot.queryParamMap.get('category') as ProductCategory | null) ?? '',
  );
  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly loading = signal(true);

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

  // Original 5 categories have curated translations; anything the owner adds later just
  // shows its name as-is rather than falling back to a raw, untranslated i18n key.
  protected categoryLabel(category: string): string {
    const translated = this.translation.translate('categories.' + category);
    return translated === 'categories.' + category ? category : translated;
  }
}
