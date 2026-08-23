import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '@dekora/shared';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ProductCard } from '../product-card/product-card';

// A self-scrolling (right-to-left) rail of products — used for both the homepage and
// product-page "trending now" / "customers are also ordering" sections. Purely
// presentational: the parent fetches the product list and passes it in.
@Component({
  selector: 'app-product-carousel',
  imports: [RouterLink, ProductCard, TranslatePipe],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss',
})
export class ProductCarousel {
  @Input() heading = '';
  @Input() seeAllLink: string | null = null;
  @Input() products: ProductListItem[] = [];

  protected readonly translation = inject(TranslationService);

  // Keeps scroll speed roughly consistent regardless of how many products are in the rail.
  protected get scrollDurationSeconds(): number {
    return Math.max(20, this.products.length * 4);
  }
}
