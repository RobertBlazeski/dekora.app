import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const BAG_SVG = `
<svg viewBox="0 0 24 24">
  <path d="M6 8h12l1 12.1a1 1 0 01-1 1.9H6a1 1 0 01-1-1.9L6 8z" fill="currentColor"/>
  <path d="M8.5 8V6.5a3.5 3.5 0 117 0V8" fill="none" stroke="var(--color-card)" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

// The header registers its cart icon's position on load; product-detail (or anywhere else that
// adds to cart) calls fly() with the source photo element and image. A shopping bag pops in at
// the center of the screen while the product photo travels from its source into it, then the
// bag itself squashes on impact, rebounds, and flies up into the header's cart icon — all as one
// continuous motion. Earlier this was three separate chained animations (pop in, then a full
// stop, then a separate "settle" wobble, then a third animation flying to the cart), which read
// as stop-and-go rather than fluid — real full-stop pauses between each stage instead of one
// physically continuous path. Now the impact squash and the flight to the cart are baked into a
// single Animation timeline, so there's only one handoff point in the whole sequence (the moment
// the photo lands) instead of three. Deliberately not routed through Angular's view layer —
// every element here is a plain DOM node appended straight to <body> (see
// .fly-to-cart-bag/.fly-to-cart-ghost in styles.scss) and driven by the Web Animations API, so it
// can travel across two completely unrelated components without either one knowing about the
// other's internals.
@Injectable({ providedIn: 'root' })
export class FlyToCartService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private cartTarget: HTMLElement | null = null;

  registerCartTarget(el: HTMLElement): void {
    this.cartTarget = el;
  }

  fly(sourceEl: HTMLElement, imageUrl: string | null): void {
    if (!this.isBrowser || !imageUrl || !this.cartTarget) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    if (sourceRect.width === 0 || sourceRect.height === 0) return;

    const bagCenterX = window.innerWidth / 2;
    const bagCenterY = window.innerHeight * 0.42;

    const bag = document.createElement('div');
    bag.className = 'fly-to-cart-bag';
    bag.innerHTML = BAG_SVG;
    document.body.appendChild(bag);

    bag.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0, offset: 0 },
        { transform: 'translate(-50%, -50%) scale(1.12)', opacity: 1, offset: 0.7 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 1 },
      ],
      { duration: 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );

    const ghost = document.createElement('div');
    ghost.className = 'fly-to-cart-ghost';
    ghost.style.backgroundImage = `url(${imageUrl})`;
    ghost.style.left = `${sourceRect.left}px`;
    ghost.style.top = `${sourceRect.top}px`;
    ghost.style.width = `${sourceRect.width}px`;
    ghost.style.height = `${sourceRect.height}px`;
    document.body.appendChild(ghost);

    const gx = bagCenterX - (sourceRect.left + sourceRect.width / 2);
    const gy = bagCenterY - (sourceRect.top + sourceRect.height / 2);

    const ghostFly = ghost.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate(${gx * 0.6}px, ${gy * 0.6 - 40}px) scale(0.55)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${gx}px, ${gy}px) scale(0.1)`, opacity: 0, offset: 1 },
      ],
      { duration: 380, delay: 100, easing: 'cubic-bezier(0.3, 0, 0.6, 1)' },
    );

    ghostFly.onfinish = () => {
      ghost.remove();

      const target = this.cartTarget?.getBoundingClientRect();
      if (!target) {
        bag.remove();
        return;
      }

      const dx = target.left + target.width / 2 - bagCenterX;
      const dy = target.top + target.height / 2 - bagCenterY;

      // The impact squash, the rebound, and the flight to the cart icon are all one timeline —
      // by the 42% mark the bag is already drifting toward the cart while its own squash/stretch
      // is still resolving, so there's no dead stop between "the photo landed" and "the bag
      // leaves": it's one continuous motion, just like a real thrown object would move.
      const bagFly = bag.animate(
        [
          { transform: 'translate(-50%, -50%) translate(0, 0) scale(1, 1)', opacity: 1, offset: 0 },
          { transform: 'translate(-50%, -50%) translate(0, 0) scale(1.16, 0.84)', opacity: 1, offset: 0.12 },
          { transform: 'translate(-50%, -50%) translate(0, 0) scale(0.92, 1.1)', opacity: 1, offset: 0.28 },
          {
            transform: `translate(-50%, -50%) translate(${dx * 0.3}px, ${dy * 0.3}px) scale(1, 1)`,
            opacity: 1,
            offset: 0.42,
          },
          {
            transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.22, 0.22)`,
            opacity: 0.4,
            offset: 1,
          },
        ],
        { duration: 480, easing: 'cubic-bezier(0.32, 0, 0.67, 1)' },
      );
      bagFly.onfinish = () => bag.remove();
    };
  }
}
