export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  // Splits the homepage into two separate rails — "Shop by occasion" (false, the default) and
  // "Shop by type" (true) — set once by the owner when they create the category.
  isProductType: boolean;
  // A photo from the best-looking product currently in this category, for the homepage tile —
  // null until the category has at least one (non-sold-out) product in it.
  sampleImageUrl: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  isProductType?: boolean;
}
