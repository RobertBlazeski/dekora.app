import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '@dekora/shared';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ProductCard } from '../product-card/product-card';

// A self-scrolling rail of products — used for both the homepage and product-page "trending
// now" / "customers are also ordering" sections. Purely presentational: the parent fetches the
// product list and passes it in.
//
// Moves on its own via a plain CSS transform loop (translateX across a doubled track, looping
// at exactly -50%) rather than any JS-driven scrollLeft manipulation — that earlier approach
// needed runtime math to detect and correct for the loop point, which kept surfacing edge-case
// bugs (especially with short lists, where the loop comes around often). A CSS animation loops
// natively and atomically at the browser level: there's no position to compute or correct, so
// there's nothing left to glitch. It pauses on hover/focus/touch so a customer can still read
// and click a specific card precisely, and — for free, via the sitewide prefers-reduced-motion
// rule in _base.scss — never plays at all for anyone who's asked for reduced motion.
const PX_PER_SECOND = 32;
const AVERAGE_CARD_WIDTH = 216; // card width + track gap, used only to pace the animation

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

  // How long one full lap of the (single, un-doubled) list should take — proportional to how
  // much content there is, so a 3-product rail and a 20-product rail both drift at roughly the
  // same visual speed rather than the longer one racing past.
  protected get loopDurationSeconds(): number {
    return Math.max(8, (this.products.length * AVERAGE_CARD_WIDTH) / PX_PER_SECOND);
  }
}
