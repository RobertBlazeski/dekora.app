export interface Category {
  id: string;
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  sortOrder: number;
  // Splits the homepage (and the shop page's filter chips) into two separate groups — "Shop by
  // occasion" (false, the default) and "Shop by type" (true) — editable any time.
  isProductType: boolean;
  // A photo from the best-looking product currently in this category, for the homepage tile —
  // null until the category has at least one (non-sold-out) product in it.
  sampleImageUrl: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  nameEn?: string | null;
  nameSq?: string | null;
  isProductType?: boolean;
}

export interface UpdateCategoryRequest {
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  isProductType: boolean;
}
