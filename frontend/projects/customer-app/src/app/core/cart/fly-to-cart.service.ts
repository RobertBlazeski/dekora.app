import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

// The header registers its cart icon's position on load; product-detail (or anywhere else that
// adds to cart) calls fly() with the source photo element and image. Deliberately not routed
// through Angular's view layer — the ghost element is a plain DOM node appended straight to
// <body> (see .fly-to-cart-ghost in styles.scss) and driven by the Web Animations API, so it can
// travel across two completely unrelated components without either one knowing about the other's
// internals.
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

    const from = sourceEl.getBoundingClientRect();
    const to = this.cartTarget.getBoundingClientRect();
    if (from.width === 0 || from.height === 0) return;

    const ghost = document.createElement('div');
    ghost.className = 'fly-to-cart-ghost';
    ghost.style.backgroundImage = `url(${imageUrl})`;
    ghost.style.left = `${from.left}px`;
    ghost.style.top = `${from.top}px`;
    ghost.style.width = `${from.width}px`;
    ghost.style.height = `${from.height}px`;
    document.body.appendChild(ghost);

    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);

    const animation = ghost.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        // A slight upward arc partway through reads as a "toss" rather than a straight-line
        // slide, which is what actually sells the "flying to the cart" illusion.
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 50}px) scale(0.55)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0.4, offset: 1 },
      ],
      { duration: 700, easing: 'cubic-bezier(0.32, 0, 0.55, 1)' },
    );
    animation.onfinish = () => ghost.remove();
  }
}
