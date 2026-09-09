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

// The doubled-track trick (see product-carousel.html) is only seamless when each half is wider
// than the viewport — otherwise the track runs out of cards before the halfway point and the
// rest of the viewport shows empty space until the animation wraps. A generous width covering
// even a wide desktop monitor, so a short list (e.g. 3 trending products) still repeats enough
// times to stay full edge-to-edge no matter how wide the screen is.
const MIN_HALF_WIDTH_PX = 2600;

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
  // Set by the parent while its fetch is in flight, so this shows a shimmering placeholder rail
  // instead of just rendering nothing at all until the request resolves.
  @Input() loading = false;

  protected readonly translation = inject(TranslationService);
  protected readonly skeletonSlots = Array.from({ length: 5 }, (_, i) => i);

  // Each half of the doubled track is this list repeated enough times to comfortably exceed
  // MIN_HALF_WIDTH_PX, so short lists still fill (and loop seamlessly across) wide viewports.
  protected get repeatedProducts(): ProductListItem[] {
    const singleWidth = this.products.length * AVERAGE_CARD_WIDTH;
    const repeats = singleWidth > 0 ? Math.max(1, Math.ceil(MIN_HALF_WIDTH_PX / singleWidth)) : 1;
    return Array.from({ length: repeats }, () => this.products).flat();
  }

  // How long one full lap of a (single, un-doubled) half should take — proportional to how much
  // content there is, so a short rail and a long one both drift at roughly the same visual speed
  // rather than the longer one racing past.
  protected get loopDurationSeconds(): number {
    return Math.max(8, (this.repeatedProducts.length * AVERAGE_CARD_WIDTH) / PX_PER_SECOND);
  }
}
