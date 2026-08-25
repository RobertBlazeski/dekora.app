import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, PLATFORM_ID, afterNextRender, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '@dekora/shared';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ProductCard } from '../product-card/product-card';

const BASE_SPEED_PX_PER_SECOND = 40;

// A self-scrolling rail of products — used for both the homepage and product-page "trending
// now" / "customers are also ordering" sections. Purely presentational: the parent fetches the
// product list and passes it in.
//
// The track is a real scrollable element (not a CSS transform loop), driven by a
// requestAnimationFrame step that nudges scrollLeft forward every frame — that's what lets a
// mouse hovering near either edge speed it up or reverse it, and lets a phone's native touch
// scroll take over directly (the loop just steps back while a finger/mouse is actually dragging
// it, so it never fights the gesture). The list is rendered twice back-to-back so the loop point
// is invisible: once scrollLeft passes one full copy's width, it wraps back by that same amount.
@Component({
  selector: 'app-product-carousel',
  imports: [RouterLink, ProductCard, TranslatePipe],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss',
})
export class ProductCarousel implements OnDestroy {
  @Input() heading = '';
  @Input() seeAllLink: string | null = null;
  @Input() products: ProductListItem[] = [];

  protected readonly translation = inject(TranslationService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');

  // 0 while the pointer is away/centered (normal forward speed), negative while hovering the
  // left edge (reverses), positive up to 3x while hovering the right edge (fast-forward).
  private speedMultiplier = 1;
  private dragging = false;
  private lastTimestamp: number | null = null;
  private frameId: number | null = null;

  constructor() {
    // Started unconditionally (not gated on `products` already being populated) — `products`
    // arrives asynchronously from the parent's API call, well after this constructor runs, so
    // checking its length here would permanently skip starting the loop. `step` itself already
    // no-ops safely whenever the viewport isn't rendered yet (the template's @if hides it while
    // the list is still empty) or has no content to scroll.
    //
    // A sitewide rule (see _base.scss) freezes every CSS animation for prefers-reduced-motion,
    // which the old version relied on for free — this one drives scrollLeft directly instead of
    // through a CSS animation, so that rule no longer reaches it, and it needs its own check to
    // not regress that: reduced motion just leaves the track as a plain manually-scrollable list.
    afterNextRender(() => {
      if (!this.isBrowser) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.frameId = requestAnimationFrame(this.step);
    });
  }

  ngOnDestroy(): void {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
  }

  private readonly step = (timestamp: number): void => {
    const el = this.viewport()?.nativeElement;
    if (el && !this.dragging) {
      const delta = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
      // scrollWidth spans both copies of the list, so half of it is exactly one copy's width —
      // the point at which the loop should wrap.
      const loopWidth = el.scrollWidth / 2;
      if (loopWidth > 0) {
        let next = el.scrollLeft + BASE_SPEED_PX_PER_SECOND * this.speedMultiplier * delta;
        if (next >= loopWidth) next -= loopWidth;
        if (next < 0) next += loopWidth;
        el.scrollLeft = next;
      }
    }
    this.lastTimestamp = timestamp;
    this.frameId = requestAnimationFrame(this.step);
  };

  // Only mouse hover drives the speed-by-position effect — a touch "move" firing this would
  // fight with the finger actually dragging the track.
  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const el = this.viewport()?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.speedMultiplier = mapPositionToSpeed(fraction);
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.speedMultiplier = 1;
  }

  // While an actual drag/swipe is happening (touch or mouse), the auto-scroll step backs off
  // entirely and lets the browser's native scrolling handle it — resuming from wherever that
  // gesture left the track once it ends.
  protected onPointerDown(): void {
    this.dragging = true;
  }

  protected onPointerUp(): void {
    this.dragging = false;
  }
}

// Continuous, not a hard edge/center split — hovering the exact left edge reverses at 1.5x,
// the center holds the normal 1x forward speed, and the right edge fast-forwards at 3x, with a
// smooth ramp in between so the response feels proportional to how close to an edge you are.
function mapPositionToSpeed(fraction: number): number {
  if (fraction >= 0.5) return 1 + (fraction - 0.5) * 4;
  return 1 - (0.5 - fraction) * 5;
}
