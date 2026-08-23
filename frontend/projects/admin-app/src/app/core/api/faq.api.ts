import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContactInfo, FaqEntry, UpdateContactInfoRequest, UpsertFaqEntryRequest } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FaqApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<FaqEntry[]> {
    return this.http.get<FaqEntry[]>(`${environment.apiUrl}/faq`);
  }

  create(request: UpsertFaqEntryRequest): Observable<FaqEntry> {
    return this.http.post<FaqEntry>(`${environment.apiUrl}/faq`, request);
  }

  update(id: string, request: UpsertFaqEntryRequest): Observable<FaqEntry> {
    return this.http.put<FaqEntry>(`${environment.apiUrl}/faq/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/faq/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ContactInfoApi {
  private readonly http = inject(HttpClient);

  get(): Observable<ContactInfo> {
    return this.http.get<ContactInfo>(`${environment.apiUrl}/contact-info`);
  }

  update(request: UpdateContactInfoRequest): Observable<ContactInfo> {
    return this.http.put<ContactInfo>(`${environment.apiUrl}/contact-info`, request);
  }
}
