import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateReviewRequest, Review } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);

  getForProduct(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${environment.apiUrl}/products/${productId}/reviews`);
  }

  create(request: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${environment.apiUrl}/reviews`, request);
  }
}
