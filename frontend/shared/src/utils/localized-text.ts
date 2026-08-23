// Generic version of resolveProductName's fallback pattern — used for FAQ question/answer
// pairs, where "mk" is the value the owner actually typed and the en/sq variants are optional.
export function resolveLocalizedText(
  locale: string,
  defaultText: string,
  textEn: string | null,
  textSq: string | null,
): string {
  if (locale === 'en') return textEn?.trim() || defaultText;
  if (locale === 'sq') return textSq?.trim() || defaultText;
  return defaultText;
}
