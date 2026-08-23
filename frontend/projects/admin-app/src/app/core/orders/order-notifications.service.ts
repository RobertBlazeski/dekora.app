import { Injectable, effect, inject, signal } from '@angular/core';
import { OrderSummary } from '@dekora/shared';
import { AuthService } from '../auth/auth.service';
import { OrdersApi } from '../api/orders.api';

const POLL_INTERVAL_MS = 20_000;

// Drives two things: the unread badge on the sidebar's "Orders" link, and the toast stack of
// "orders you missed" shown right after login (and live, for any that arrive while the owner is
// already using the dashboard). Starts polling the moment the owner is authenticated and stops
// the moment they log out, so it never runs against the public login page.
@Injectable({ providedIn: 'root' })
export class OrderNotifications {
  private readonly ordersApi = inject(OrdersApi);
  private readonly auth = inject(AuthService);

  readonly unviewedCount = signal(0);
  readonly toastQueue = signal<OrderSummary[]>([]);

  private knownUnviewedIds = new Set<string>();
  private pollTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) this.start();
      else this.stop();
    });
  }

  private start(): void {
    if (this.pollTimer) return;
    // knownUnviewedIds starts empty here, so this first refresh naturally treats every
    // currently-unviewed order as "new" — exactly the "what you missed" set for the toast stack.
    this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), POLL_INTERVAL_MS);
  }

  private stop(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
    this.knownUnviewedIds.clear();
    this.unviewedCount.set(0);
    this.toastQueue.set([]);
  }

  private refresh(): void {
    this.ordersApi.getUnviewed().subscribe((orders) => {
      this.unviewedCount.set(orders.length);

      const currentIds = new Set(orders.map((o) => o.id));
      // Orders viewed elsewhere (e.g. the Orders page) since the last poll — stop tracking them.
      for (const id of this.knownUnviewedIds) {
        if (!currentIds.has(id)) this.knownUnviewedIds.delete(id);
      }

      const newOnes = orders.filter((o) => !this.knownUnviewedIds.has(o.id));
      newOnes.forEach((o) => this.knownUnviewedIds.add(o.id));

      if (newOnes.length > 0) {
        this.toastQueue.update((queue) => [...queue, ...newOnes]);
      }
    });
  }

  dismissToast(orderId: string): void {
    this.toastQueue.update((queue) => queue.filter((o) => o.id !== orderId));
  }

  // Called right after an order's details are opened, so the badge/queue update immediately
  // instead of waiting for the next poll.
  markViewedLocally(orderId: string): void {
    this.knownUnviewedIds.delete(orderId);
    this.unviewedCount.update((count) => Math.max(0, count - 1));
    this.dismissToast(orderId);
  }
}
