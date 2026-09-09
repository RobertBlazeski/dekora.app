import { Component, computed, inject, signal } from '@angular/core';
import { ProductListItem } from '@dekora/shared';
import { ProductsApi } from '../../core/api/products.api';
import { WishlistService } from '../../core/wishlist/wishlist.service';
import { ProductCard } from '../../components/product-card/product-card';
import { RevealOnScrollDirective } from '../../core/reveal/reveal-on-scroll.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-wishlist',
  imports: [TranslatePipe, ProductCard, RevealOnScrollDirective],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class Wishlist {
  private readonly productsApi = inject(ProductsApi);
  protected readonly wishlist = inject(WishlistService);
  protected readonly translation = inject(TranslationService);

  private readonly allProducts = signal<ProductListItem[]>([]);
  protected readonly wishlistedProducts = computed(() => {
    const ids = new Set(this.wishlist.idsSnapshot());
    return this.allProducts().filter((p) => ids.has(p.id));
  });

  constructor() {
    // Fine to fetch the whole catalog and filter client-side at this shop's scale — no
    // "get products by ids" endpoint exists, and building one just for this would be overkill.
    this.productsApi.getAll().subscribe((products) => this.allProducts.set(products));
  }
}
