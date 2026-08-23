export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  // A photo from the best-looking product currently in this category, for the homepage "shop by
  // occasion" tiles — null until the category has at least one (non-sold-out) product in it.
  sampleImageUrl: string | null;
}

export interface CreateCategoryRequest {
  name: string;
}
