import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, PLATFORM_ID, afterNextRender, inject, input } from '@angular/core';

// Adds .is-visible (see styles.scss's .reveal-on-scroll rule) the first time this element
// scrolls into view, then stops watching — a one-way reveal, not something that re-triggers on
// every scroll past. Falls back to revealing immediately (no animation) for
// prefers-reduced-motion or if IntersectionObserver isn't available, so content is never stuck
// invisible.
@Directive({
  selector: '[appRevealOnScroll]',
  host: { class: 'reveal-on-scroll' },
})
export class RevealOnScrollDirective {
  // Optional stagger, in ms, for cascading a grid of these in one at a time — pass e.g.
  // `(index % 8) * 45` from an @for loop rather than a raw unbounded index, so a long list
  // doesn't leave the last cards waiting seconds to appear.
  readonly appRevealOnScrollDelay = input(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement;
      if (!this.isBrowser || !('IntersectionObserver' in window) || prefersReducedMotion()) {
        node.classList.add('is-visible');
        return;
      }

      node.style.transitionDelay = `${this.appRevealOnScrollDelay()}ms`;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            node.classList.add('is-visible');
            observer.unobserve(node);
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
      );
      observer.observe(node);
    });
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
