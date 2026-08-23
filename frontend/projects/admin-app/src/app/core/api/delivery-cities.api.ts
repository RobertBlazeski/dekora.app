import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateDeliveryCityRequest, DeliveryCity } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DeliveryCitiesApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<DeliveryCity[]> {
    return this.http.get<DeliveryCity[]>(`${environment.apiUrl}/delivery-cities`);
  }

  create(request: CreateDeliveryCityRequest): Observable<DeliveryCity> {
    return this.http.post<DeliveryCity>(`${environment.apiUrl}/delivery-cities`, request);
  }
}
