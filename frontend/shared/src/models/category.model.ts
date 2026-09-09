export interface Category {
  id: string;
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  sortOrder: number;
  // Splits the homepage (and the shop page's filter chips) into two separate groups — "Shop by
  // occasion" (false, the default) and "Shop by type" (true) — editable any time.
  isProductType: boolean;
  // The homepage tile photo for this category — null until the owner explicitly picks a product
  // to represent it (see CategoriesApi.setShowcase); never guessed automatically.
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
