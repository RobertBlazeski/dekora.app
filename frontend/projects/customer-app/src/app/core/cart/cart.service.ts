import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CartItem } from './cart.model';

const STORAGE_KEY = 'dekora.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly items = signal<CartItem[]>(this.readStoredItems());

  readonly cartItems = this.items.asReadonly();
  readonly itemCount = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));

  addItem(item: Omit<CartItem, 'id'>): void {
    const newItem: CartItem = { ...item, id: crypto.randomUUID() };
    this.items.update((items) => [...items, newItem]);
    this.persist();
  }

  removeItem(id: string): void {
    this.items.update((items) => items.filter((i) => i.id !== id));
    this.persist();
  }

  updateQuantity(id: string, quantity: number): void {
    if (quantity < 1) return;
    this.items.update((items) => items.map((i) => (i.id === id ? { ...i, quantity } : i)));
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  private persist(): void {
    if (this.isBrowser) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
  }

  private readStoredItems(): CartItem[] {
    if (!this.isBrowser) return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  }
}
