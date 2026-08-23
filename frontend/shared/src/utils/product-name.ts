// Name is always the "mk" / default value; NameEn and NameSq are optional per-product
// overrides the owner can fill in when they want a product's name translated — falls back to
// the default name for whichever locale wasn't given one, so a product never renders blank.
export function resolveProductName(
  locale: string,
  product: { name: string; nameEn: string | null; nameSq: string | null },
): string {
  if (locale === 'en') return product.nameEn?.trim() || product.name;
  if (locale === 'sq') return product.nameSq?.trim() || product.name;
  return product.name;
}
