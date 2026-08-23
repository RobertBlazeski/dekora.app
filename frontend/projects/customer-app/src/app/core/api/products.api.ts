import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductCategory, ProductDetail, ProductListItem } from '@dekora/shared';
import { environment } from '../../../environments/environment';

export interface ProductSearchParams {
  search?: string;
  category?: ProductCategory;
  tag?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  getAll(params: ProductSearchParams = {}): Observable<ProductListItem[]> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.tag) httpParams = httpParams.set('tag', params.tag);

    return this.http.get<ProductListItem[]>(`${environment.apiUrl}/products`, { params: httpParams });
  }

  getById(id: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${environment.apiUrl}/products/${id}`);
  }

  getTrending(take = 12): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${environment.apiUrl}/products/trending`, { params: { take } });
  }

  getAlsoOrdered(productId: string, take = 8): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${environment.apiUrl}/products/${productId}/also-ordered`, {
      params: { take },
    });
  }
}
