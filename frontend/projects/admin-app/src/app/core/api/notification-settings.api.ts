import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationSettings, TestNotificationResult } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationSettingsApi {
  private readonly http = inject(HttpClient);

  get(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${environment.apiUrl}/notification-settings`);
  }

  update(settings: NotificationSettings): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${environment.apiUrl}/notification-settings`, settings);
  }

  sendTest(): Observable<TestNotificationResult> {
    return this.http.post<TestNotificationResult>(`${environment.apiUrl}/notification-settings/test`, {});
  }
}
