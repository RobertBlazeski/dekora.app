import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerListItem } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomersApi {
  private readonly http = inject(HttpClient);

  getAll(search?: string): Observable<CustomerListItem[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<CustomerListItem[]>(`${environment.apiUrl}/customers`, { params });
  }
}
