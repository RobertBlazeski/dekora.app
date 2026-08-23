import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { AnalyticsOverview, CategorySales, DailyMetric, DailySales, TopProduct } from '@dekora/shared';
import { AnalyticsApi } from '../../core/api/analytics.api';

Chart.register(...registerables);

type Range = '7d' | '30d';

const CATEGORY_COLORS = ['#E2635F', '#C97B92', '#7C9473', '#D9A441', '#8B6BA8', '#3D2A3B'];

@Component({
  selector: 'app-analytics',
  imports: [DecimalPipe],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics {
  private readonly analyticsApi = inject(AnalyticsApi);

  protected readonly range = signal<Range>('7d');
  protected readonly overview = signal<AnalyticsOverview | null>(null);
  protected readonly salesPerDay = signal<DailySales[]>([]);
  protected readonly dailyMetrics = signal<DailyMetric[]>([]);
  protected readonly categorySales = signal<CategorySales[]>([]);
  protected readonly topProducts = signal<TopProduct[]>([]);

  protected readonly totalRevenue = computed(() => this.salesPerDay().reduce((sum, d) => sum + d.revenue, 0));
  protected readonly totalOrders = computed(() => this.salesPerDay().reduce((sum, d) => sum + d.orderCount, 0));
  protected readonly totalVisitors = computed(() => this.dailyMetrics().reduce((sum, d) => sum + d.visitorCount, 0));
  protected readonly conversionRate = computed(() => {
    const visitors = this.totalVisitors();
    if (visitors === 0) return null;
    return Math.round((this.totalOrders() / visitors) * 1000) / 10;
  });

  protected readonly hasVisitorData = computed(() => this.dailyMetrics().some((m) => m.visitorCount > 0));
  protected readonly hasCategoryData = computed(() => this.categorySales().length > 0);
  protected readonly hasTopProducts = computed(() => this.topProducts().length > 0);
  protected readonly maxTopProductRevenue = computed(() => Math.max(1, ...this.topProducts().map((p) => p.revenue)));

  private readonly revenueCanvas = viewChild<ElementRef<HTMLCanvasElement>>('revenueCanvas');
  private readonly ordersCanvas = viewChild<ElementRef<HTMLCanvasElement>>('ordersCanvas');
  private readonly visitorsCanvas = viewChild<ElementRef<HTMLCanvasElement>>('visitorsCanvas');
  private readonly categoryCanvas = viewChild<ElementRef<HTMLCanvasElement>>('categoryCanvas');
  private revenueChart?: Chart;
  private ordersChart?: Chart;
  private visitorsChart?: Chart;
  private categoryChart?: Chart;

  constructor() {
    this.load();

    effect(() => {
      const canvasRef = this.revenueCanvas();
      const data = this.salesPerDay();
      if (!canvasRef || data.length === 0) return;
      this.renderRevenueChart(canvasRef.nativeElement, data);
    });

    effect(() => {
      const canvasRef = this.ordersCanvas();
      const data = this.salesPerDay();
      if (!canvasRef || data.length === 0) return;
      this.renderOrdersChart(canvasRef.nativeElement, data);
    });

    effect(() => {
      const canvasRef = this.visitorsCanvas();
      const data = this.dailyMetrics();
      if (!canvasRef || data.length === 0) return;
      this.renderVisitorsChart(canvasRef.nativeElement, data);
    });

    effect(() => {
      const canvasRef = this.categoryCanvas();
      const data = this.categorySales();
      if (!canvasRef || data.length === 0) return;
      this.renderCategoryChart(canvasRef.nativeElement, data);
    });
  }

  protected setRange(range: Range): void {
    this.range.set(range);
    this.load();
  }

  private load(): void {
    this.analyticsApi.getOverview().subscribe((data) => this.overview.set(data));
    this.analyticsApi.getSalesPerDay(this.range()).subscribe((data) => this.salesPerDay.set(data));
    this.analyticsApi.getDaily(this.range()).subscribe((data) => this.dailyMetrics.set(data));
    this.analyticsApi.getSalesByCategory(this.range()).subscribe((data) => this.categorySales.set(data));
    this.analyticsApi.getTopProducts(this.range()).subscribe((data) => this.topProducts.set(data));
  }

  private renderRevenueChart(canvas: HTMLCanvasElement, data: DailySales[]): void {
    this.revenueChart?.destroy();
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(226, 99, 95, 0.35)');
    gradient.addColorStop(1, 'rgba(226, 99, 95, 0)');

    this.revenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((d) => this.dayLabel(d.date)),
        datasets: [
          {
            data: data.map((d) => d.revenue),
            borderColor: '#E2635F',
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#E2635F',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => `${v} ден` } } },
      },
    });
  }

  private renderOrdersChart(canvas: HTMLCanvasElement, data: DailySales[]): void {
    this.ordersChart?.destroy();
    this.ordersChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((d) => this.dayLabel(d.date)),
        datasets: [
          {
            data: data.map((d) => d.orderCount),
            backgroundColor: '#C97B92',
            borderRadius: 6,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  private renderVisitorsChart(canvas: HTMLCanvasElement, data: DailyMetric[]): void {
    this.visitorsChart?.destroy();
    this.visitorsChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((d) => this.dayLabel(d.date)),
        datasets: [
          {
            data: data.map((d) => d.visitorCount),
            borderColor: '#7C9473',
            backgroundColor: '#7C9473',
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  private renderCategoryChart(canvas: HTMLCanvasElement, data: CategorySales[]): void {
    this.categoryChart?.destroy();
    this.categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.category),
        datasets: [
          {
            data: data.map((d) => d.revenue),
            backgroundColor: data.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } } },
      },
    });
  }

  protected dayLabel(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
