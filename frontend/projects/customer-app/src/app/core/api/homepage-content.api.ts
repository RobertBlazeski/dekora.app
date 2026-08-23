import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HomepageContent } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HomepageContentApi {
  private readonly http = inject(HttpClient);

  get(): Observable<HomepageContent> {
    return this.http.get<HomepageContent>(`${environment.apiUrl}/homepage-content`);
  }
}
