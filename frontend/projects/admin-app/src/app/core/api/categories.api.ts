import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/categories`);
  }

  create(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${environment.apiUrl}/categories`, request);
  }

  update(id: string, request: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/categories/${id}`, request);
  }

  // Pass null to clear whichever product currently showcases this category's homepage tile.
  setShowcase(id: string, productId: string | null): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/categories/${id}/showcase`, { productId });
  }
}
