import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Input, PLATFORM_ID, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '@dekora/shared';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ProductCard } from '../product-card/product-card';

// A self-scrolling rail of products — used for both the homepage and product-page "trending
// now" / "customers are also ordering" sections. Purely presentational: the parent fetches the
// product list and passes it in.
//
// This used to auto-scroll on its own with a seamless infinite loop (speeding up/reversing on
// mouse hover, wrapping endlessly in both directions). That kept surfacing subtle bugs —
// wrap-around jumps, especially with short lists where the loop point comes around often — and
// each fix uncovered a new edge case. A plain scrollable strip with arrow buttons is a much
// simpler, well-understood pattern that can't glitch the same way: it's just the browser's own
// scrolling, clamped at the real start and end, with no wraparound math to get wrong. Touch
// devices already get native swipe scrolling for free from the same underlying element.
@Component({
  selector: 'app-product-carousel',
  imports: [RouterLink, ProductCard, TranslatePipe],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss',
})
export class ProductCarousel {
  @Input() heading = '';
  @Input() seeAllLink: string | null = null;

  // A plain @Input (not a signal input) rather than restructuring every caller — the arrow
  // recompute below only needs to know that the array reference changed, which ngOnChanges
  // already reports without requiring signal-input bindings upstream.
  @Input() set products(value: ProductListItem[]) {
    this._products = value;
    // The DOM hasn't re-rendered with the new list yet at the moment the setter runs — defer
    // one tick so scrollWidth/clientWidth reflect the update before recomputing arrow state.
    queueMicrotask(() => this.updateArrowState());
  }
  get products(): ProductListItem[] {
    return this._products;
  }
  private _products: ProductListItem[] = [];

  protected readonly translation = inject(TranslationService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');

  protected readonly canScrollLeft = signal(false);
  protected readonly canScrollRight = signal(false);

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.updateArrowState();
    });
  }

  protected onScroll(): void {
    this.updateArrowState();
  }

  private updateArrowState(): void {
    if (!this.isBrowser) return;
    const el = this.viewport()?.nativeElement;
    if (!el) return;
    this.canScrollLeft.set(el.scrollLeft > 4);
    this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  // Scrolls by roughly one viewport's width — enough to feel like "the next page" of products
  // without jumping so far it's hard to tell what changed. The (scroll) event fires throughout
  // the resulting smooth-scroll animation and keeps the arrows in sync as it happens.
  protected scrollByPage(direction: -1 | 1): void {
    const el = this.viewport()?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  }
}
