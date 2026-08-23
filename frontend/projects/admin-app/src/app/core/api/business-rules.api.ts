import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessRules } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusinessRulesApi {
  private readonly http = inject(HttpClient);

  get(): Observable<BusinessRules> {
    return this.http.get<BusinessRules>(`${environment.apiUrl}/business-rules`);
  }
}
