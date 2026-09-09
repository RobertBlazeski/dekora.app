import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// A 401 on an authenticated request always means the token was rejected — expired, or (after a
// redeploy) signed with a key that no longer matches the server. Previously this failed
// completely silently: every affected feature just looked broken on its own (orders empty,
// trending buttons doing nothing, translate erroring) with nothing telling the owner why, or
// that logging in again would fix all of it at once. Clearing the stale session and bouncing to
// the login screen turns that into one obvious, actionable prompt instead.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();
  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
