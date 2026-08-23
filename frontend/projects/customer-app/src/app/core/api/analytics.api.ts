import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);

  recordVisit(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/analytics/visit`, {});
  }
}
