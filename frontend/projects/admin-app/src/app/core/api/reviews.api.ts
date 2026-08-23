import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReviewAdmin, ReviewStats } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<ReviewAdmin[]> {
    return this.http.get<ReviewAdmin[]>(`${environment.apiUrl}/reviews`);
  }

  getStats(): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${environment.apiUrl}/reviews/stats`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reviews/${id}`);
  }
}
