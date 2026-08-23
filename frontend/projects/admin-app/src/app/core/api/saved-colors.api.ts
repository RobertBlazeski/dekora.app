import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SavedColor, UpsertSavedColorRequest } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavedColorsApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<SavedColor[]> {
    return this.http.get<SavedColor[]>(`${environment.apiUrl}/saved-colors`);
  }

  save(request: UpsertSavedColorRequest): Observable<SavedColor> {
    return this.http.post<SavedColor>(`${environment.apiUrl}/saved-colors`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/saved-colors/${id}`);
  }
}
