// The customer storefront supports three languages for the Tetovo market. Product content
// (name/description) is intentionally NOT part of this system — it stays in whatever single
// language the owner enters it in (see TranslationService) so nothing needs to be written
// three times. Only static UI chrome (nav, headings, buttons) is translated.
export const SUPPORTED_LOCALES = ['mk', 'en', 'sq'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'mk';

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
