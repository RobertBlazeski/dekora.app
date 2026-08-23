import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

const STORAGE_KEY = 'dekora.wishlist';

// Client-side only, like the cart — there's no Wishlist entity in the backend; this just
// remembers a set of product ids the visitor has starred, per browser.
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly ids = signal<Set<string>>(this.readStoredIds());

  readonly count = computed(() => this.ids().size);

  has(productId: string): boolean {
    return this.ids().has(productId);
  }

  toggle(productId: string): void {
    const next = new Set(this.ids());
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    this.ids.set(next);
    this.persist();
  }

  remove(productId: string): void {
    const next = new Set(this.ids());
    next.delete(productId);
    this.ids.set(next);
    this.persist();
  }

  idsSnapshot(): string[] {
    return [...this.ids()];
  }

  private persist(): void {
    if (this.isBrowser) localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.ids()]));
  }

  private readStoredIds(): Set<string> {
    if (!this.isBrowser) return new Set();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    try {
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  }
}
