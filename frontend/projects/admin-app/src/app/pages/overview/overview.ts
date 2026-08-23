import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsOverview, DailySales, OrderSummary } from '@dekora/shared';
import { AnalyticsApi } from '../../core/api/analytics.api';
import { OrdersApi } from '../../core/api/orders.api';

@Component({
  selector: 'app-overview',
  imports: [RouterLink],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview {
  private readonly analyticsApi = inject(AnalyticsApi);
  private readonly ordersApi = inject(OrdersApi);

  protected readonly overview = signal<AnalyticsOverview | null>(null);
  protected readonly salesPerDay = signal<DailySales[]>([]);
  protected readonly pendingOrders = signal<OrderSummary[]>([]);

  protected readonly maxDailyRevenue = computed(() => Math.max(1, ...this.salesPerDay().map((d) => d.revenue)));
  protected readonly weeklyTotal = computed(() => this.salesPerDay().reduce((sum, d) => sum + d.revenue, 0));

  constructor() {
    this.analyticsApi.getOverview().subscribe((overview) => this.overview.set(overview));
    this.analyticsApi.getSalesPerDay('7d').subscribe((data) => this.salesPerDay.set(data));
    this.ordersApi.getAll('PendingConfirmation').subscribe((orders) => this.pendingOrders.set(orders.slice(0, 5)));
  }

  protected dayLabel(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
  }

  protected isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  }
}
