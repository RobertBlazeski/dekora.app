import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from '@dekora/shared';
import { AuthApi } from './auth.api';

const STORAGE_KEY = 'dekora.auth';

interface StoredSession {
  token: string;
  user: CurrentUser;
}

// Session state lives in localStorage (not a cookie) since this is a plain JWT-bearer setup —
// restored synchronously on construction so a page refresh doesn't show a flash of "logged out".
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly session = signal<StoredSession | null>(this.readStoredSession());

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  constructor() {
    // The stored session is only ever written at login/register time, so anything that changes
    // server-side afterward (points earned from new orders, most obviously) would otherwise
    // stay frozen at whatever it was when the customer last signed in — refresh it once on
    // startup so a returning, already-logged-in visitor sees their real current balance.
    if (this.isBrowser && this.session() !== null) {
      this.refreshCurrentUser();
    }
  }

  // Re-fetches the logged-in customer's own record (points, in particular, since it changes
  // with every order) and updates both the in-memory session and localStorage. Safe to call
  // whenever something might have changed it — e.g. right after an order completes.
  refreshCurrentUser(): void {
    const current = this.session();
    if (!current) return;

    this.api.me().subscribe({
      next: (user) => {
        const stored: StoredSession = { token: current.token, user };
        this.session.set(stored);
        if (this.isBrowser) localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      },
      // An expired/invalid token here just means the refresh silently no-ops — the existing
      // session stays as-is rather than logging the customer out mid-browse over a fetch error.
      error: () => {},
    });
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.login(request).pipe(tap((response) => this.setSession(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api.register(request).pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    this.session.set(null);
    if (this.isBrowser) localStorage.removeItem(STORAGE_KEY);
  }

  private setSession(response: AuthResponse): void {
    const stored: StoredSession = { token: response.token, user: response.user };
    this.session.set(stored);
    if (this.isBrowser) localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  private readStoredSession(): StoredSession | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }
}
