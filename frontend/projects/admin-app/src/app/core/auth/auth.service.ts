import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, CurrentUser, LoginRequest } from '@dekora/shared';
import { AuthApi } from './auth.api';

const STORAGE_KEY = 'dekora-admin.auth';

interface StoredSession {
  token: string;
  user: CurrentUser;
}

// The admin dashboard is a completely separate protected area, not just a customer account
// with a flag — login here requires the "Admin" role specifically, checked client-side for
// UX (redirect fast) and enforced server-side on every admin endpoint regardless.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);

  private readonly session = signal<StoredSession | null>(this.readStoredSession());

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => (this.session()?.user.roles.includes('Admin') ?? false));

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.login(request).pipe(
      tap((response) => {
        if (!response.user.roles.includes('Admin')) {
          throw new Error('This account does not have admin access.');
        }
        this.setSession(response);
      }),
    );
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private setSession(response: AuthResponse): void {
    const stored: StoredSession = { token: response.token, user: response.user };
    this.session.set(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  private readStoredSession(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }
}
