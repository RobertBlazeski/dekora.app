import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OrderNotifications } from '../../core/orders/order-notifications.service';

// A stack of "you missed this order" cards, bottom-right — built up right after login (or live,
// as new orders come in while the dashboard is open) and cleared one at a time as the owner
// dismisses or opens each one.
@Component({
  selector: 'app-order-toast-stack',
  imports: [],
  templateUrl: './order-toast-stack.html',
  styleUrl: './order-toast-stack.scss',
})
export class OrderToastStack {
  protected readonly notifications = inject(OrderNotifications);
  private readonly router = inject(Router);

  protected open(orderId: string): void {
    this.notifications.markViewedLocally(orderId);
    this.router.navigate(['/orders'], { queryParams: { open: orderId } });
  }

  protected dismiss(event: Event, orderId: string): void {
    event.stopPropagation();
    this.notifications.dismissToast(orderId);
  }
}
