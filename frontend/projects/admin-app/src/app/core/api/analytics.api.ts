import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AnalyticsOverview, CategorySales, DailyMetric, DailySales, TopProduct } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<AnalyticsOverview> {
    return this.http.get<AnalyticsOverview>(`${environment.apiUrl}/analytics/overview`);
  }

  getDaily(range: '7d' | '30d'): Observable<DailyMetric[]> {
    return this.http.get<DailyMetric[]>(`${environment.apiUrl}/analytics/daily`, { params: { range } });
  }

  getSalesPerDay(range: '7d' | '30d'): Observable<DailySales[]> {
    return this.http.get<DailySales[]>(`${environment.apiUrl}/analytics/sales-per-day`, { params: { range } });
  }

  getSalesByCategory(range: '7d' | '30d'): Observable<CategorySales[]> {
    return this.http.get<CategorySales[]>(`${environment.apiUrl}/analytics/by-category`, { params: { range } });
  }

  getTopProducts(range: '7d' | '30d', take = 5): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${environment.apiUrl}/analytics/top-products`, { params: { range, take } });
  }
}
