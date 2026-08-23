import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((err: unknown) => {
      // A request we sent as this customer came back 401 — the server has stopped honoring
      // this token (expired, revoked, or the account no longer exists). Silently carrying on as
      // if still logged in is exactly how a customer could place an order believing they're
      // earning points while it's actually saved as an anonymous guest order server-side — force
      // a clean logout instead so the UI matches reality and they're prompted to sign in again.
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
