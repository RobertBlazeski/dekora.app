import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminAccount, AuthResponse, CreateAdminRequest, LoginRequest } from '@dekora/shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request);
  }

  getAdmins(): Observable<AdminAccount[]> {
    return this.http.get<AdminAccount[]>(`${environment.apiUrl}/auth/admins`);
  }

  createAdmin(request: CreateAdminRequest): Observable<AdminAccount> {
    return this.http.post<AdminAccount>(`${environment.apiUrl}/auth/create-admin`, request);
  }
}
