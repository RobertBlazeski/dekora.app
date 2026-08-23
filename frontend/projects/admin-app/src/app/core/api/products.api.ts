import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductDetail, ProductListItem, UpsertProductRequest } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${environment.apiUrl}/products`);
  }

  getById(id: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${environment.apiUrl}/products/${id}`);
  }

  create(request: UpsertProductRequest): Observable<ProductDetail> {
    return this.http.post<ProductDetail>(`${environment.apiUrl}/products`, request);
  }

  update(id: string, request: UpsertProductRequest): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`${environment.apiUrl}/products/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/products/${id}`);
  }

  setSoldOut(id: string, soldOut: boolean): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/products/${id}/sold-out`, { soldOut });
  }

  setColorSoldOut(productId: string, colorId: string, soldOut: boolean): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/products/${productId}/colors/${colorId}/sold-out`, { soldOut });
  }

  setTrending(id: string, isTrending: boolean, trendingOrder: number | null): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/products/${id}/trending`, { isTrending, trendingOrder });
  }

  setFeatured(id: string, isFeatured: boolean): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/products/${id}/featured`, { isFeatured });
  }
}
