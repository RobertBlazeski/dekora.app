import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContactInfo, FaqEntry } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FaqApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<FaqEntry[]> {
    return this.http.get<FaqEntry[]>(`${environment.apiUrl}/faq`);
  }
}

@Injectable({ providedIn: 'root' })
export class ContactInfoApi {
  private readonly http = inject(HttpClient);

  get(): Observable<ContactInfo> {
    return this.http.get<ContactInfo>(`${environment.apiUrl}/contact-info`);
  }
}
