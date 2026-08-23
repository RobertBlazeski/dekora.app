import { Injectable, signal } from '@angular/core';

export interface WishlistToastState {
  id: number;
  name: string;
  added: boolean;
  leaving: boolean;
}

// A tiny, one-at-a-time toast for wishlist add/remove feedback — deliberately separate from the
// heart icon's own pop animation (see product-card.scss's heart-pop keyframes), which is subtle
// enough that it's easy to miss, especially on a small photo in a dense grid.
@Injectable({ providedIn: 'root' })
export class WishlistToastService {
  readonly state = signal<WishlistToastState | null>(null);

  private counter = 0;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private clearTimer: ReturnType<typeof setTimeout> | undefined;

  show(name: string, added: boolean): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.clearTimer);

    const id = ++this.counter;
    this.state.set({ id, name, added, leaving: false });

    this.hideTimer = setTimeout(() => {
      this.state.update((s) => (s?.id === id ? { ...s, leaving: true } : s));
      this.clearTimer = setTimeout(() => {
        this.state.update((s) => (s?.id === id ? null : s));
      }, 220);
    }, 2200);
  }
}
