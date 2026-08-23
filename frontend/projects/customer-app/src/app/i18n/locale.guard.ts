import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEFAULT_LOCALE, isLocale } from './locale';
import { TranslationService } from './translation.service';

// Validates the :lang route param and puts the app into that locale. An unknown/missing
// value (e.g. /fr/shop, or a bare /shop) redirects to the default locale rather than 404ing —
// keeps stray/legacy links usable instead of dead ends.
export const localeGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const translation = inject(TranslationService);
  const lang = route.paramMap.get('lang');

  if (!isLocale(lang)) {
    return router.parseUrl(`/${DEFAULT_LOCALE}`);
  }

  translation.setLocale(lang);
  return true;
};
