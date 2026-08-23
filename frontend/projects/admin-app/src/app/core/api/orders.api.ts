import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateManualOrderRequest, Order, OrderStatus, OrderSummary } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);

  getAll(status?: OrderStatus | '', search?: string): Observable<OrderSummary[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<OrderSummary[]>(`${environment.apiUrl}/orders`, { params });
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${environment.apiUrl}/orders/${id}`);
  }

  updateStatus(id: string, status: OrderStatus): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/orders/${id}/status`, { status });
  }

  createManual(request: CreateManualOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/orders/manual`, request);
  }

  getUnviewed(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${environment.apiUrl}/orders/unviewed`);
  }

  getUnviewedCount(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/orders/unviewed-count`);
  }
}
