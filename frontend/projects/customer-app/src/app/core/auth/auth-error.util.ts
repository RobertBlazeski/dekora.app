import { HttpErrorResponse } from '@angular/common/http';

// Maps ASP.NET Identity's error codes (see AuthController's ValidationProblem) to translation
// keys, so a real reason ("password needs a number") reaches the customer instead of a vague
// fallback. The client-side password validator (see password-policy.validator.ts) mirrors the
// same rules and should catch these before submit — this is the backstop for whatever slips
// through (e.g. an expired/reused reset token).
const IDENTITY_ERROR_KEYS: Record<string, string> = {
  PasswordTooShort: 'authPage.errorPasswordTooShort',
  PasswordRequiresDigit: 'authPage.errorPasswordRequiresDigit',
  PasswordRequiresLetter: 'authPage.errorPasswordRequiresLower',
  PasswordRequiresLower: 'authPage.errorPasswordRequiresLower',
  PasswordRequiresUpper: 'authPage.errorPasswordRequiresLower',
  PasswordRequiresNonAlphanumeric: 'authPage.errorPasswordRequiresDigit',
  PasswordRequiresUniqueChars: 'authPage.errorPasswordTooShort',
  DuplicateUserName: 'authPage.emailInUse',
  DuplicateEmail: 'authPage.emailInUse',
  InvalidToken: 'authPage.errorInvalidToken',
};

// Translation keys to render as the error list — always at least one, so the page never shows
// a blank error state.
export function describeAuthError(err: unknown): string[] {
  if (!(err instanceof HttpErrorResponse)) return ['authPage.serverError'];

  if (err.status === 0) return ['authPage.networkError'];
  if (err.status === 401) return ['authPage.invalidCredentials'];
  if (err.status === 409) return ['authPage.emailInUse'];
  if (err.status === 429) return ['authPage.tooManyAttempts'];

  if (err.status === 400 && err.error?.errors && typeof err.error.errors === 'object') {
    const keys = Object.keys(err.error.errors).map((code) => IDENTITY_ERROR_KEYS[code] ?? 'authPage.genericValidationError');
    const unique = Array.from(new Set(keys));
    return unique.length ? unique : ['authPage.genericValidationError'];
  }

  return ['authPage.serverError'];
}
