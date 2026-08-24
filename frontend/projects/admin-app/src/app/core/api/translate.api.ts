import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TranslateApi {
  private readonly http = inject(HttpClient);

  // Source is always Macedonian — every "Translate" button in the dashboard drafts an EN/SQ
  // version from the Macedonian field the owner already filled in.
  translate(text: string, targetLanguage: 'en' | 'sq'): Observable<string> {
    return this.http
      .post<{ translatedText: string }>(`${environment.apiUrl}/translate`, { text, targetLanguage })
      .pipe(map((res) => res.translatedText));
  }
}
