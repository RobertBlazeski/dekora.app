import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem, resolveAssetUrl, resolveProductName } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { WishlistService } from '../../core/wishlist/wishlist.service';
import { WishlistToastService } from '../../core/wishlist/wishlist-toast.service';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input({ required: true }) product!: ProductListItem;
  // Set for the hidden duplicate half of a carousel's looping track, so assistive tech and
  // keyboard focus skip it — it's a visual copy, not distinct content.
  @Input() hidden = false;

  protected readonly translation = inject(TranslationService);
  protected readonly wishlist = inject(WishlistService);
  private readonly wishlistToast = inject(WishlistToastService);

  // Plain getters, not computed() — `product` is a legacy @Input(), not a signal, so a
  // computed() here would memoize on first read and never notice the input changing.
  protected get displayName(): string {
    return resolveProductName(this.translation.currentLocale(), this.product);
  }

  protected get imageUrl(): string | null {
    return resolveAssetUrl(environment.apiUrl, this.product.primaryImageUrl);
  }

  protected toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const wasWishlisted = this.wishlist.has(this.product.id);
    this.wishlist.toggle(this.product.id);
    this.wishlistToast.show(this.displayName, !wasWishlisted);
  }
}
