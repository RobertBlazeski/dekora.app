import { ProductCategory } from './enums';

export interface ProductImage {
  id: string;
  url: string;
  colorTag: string | null;
}

export interface ProductSize {
  id: string;
  name: string;
  description: string | null;
  // Absolute price for this size — NOT added on top of basePrice. Picking this size replaces
  // the price outright (e.g. Small = 450 ден total, not basePrice + 450).
  price: number;
  discountedPrice: number | null;
}

export interface ProductColor {
  id: string;
  name: string;
  hexValue: string;
  soldOut: boolean;
}

// Owner-defined named group of swatches (e.g. "Box color", "Rose color", "Balloon color") —
// a product has only the groups the owner actually added, not a fixed set.
export interface ProductColorGroup {
  id: string;
  name: string;
  sortOrder: number;
  colors: ProductColor[];
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  basePrice: number;
  lowestPrice: number;
  isDiscounted: boolean;
  discountPercent: number | null;
  categories: ProductCategory[];
  soldOut: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  primaryImageUrl: string | null;
}

export interface ProductDetail {
  id: string;
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  description: string;
  descriptionEn: string | null;
  descriptionSq: string | null;
  basePrice: number;
  discountedPrice: number | null;
  categories: ProductCategory[];
  tags: string[];
  // Subset of categories the owner picked this product's photo to represent on the homepage
  // "shop by occasion" tile — see Category.sampleImageUrl.
  showcaseCategories: string[];
  soldOut: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  sizesEnabled: boolean;
  customSizeEnabled: boolean;
  customSizeUnitPrice: number | null;
  customSizeUnitLabel: string | null;
  customSizeBaseFee: number | null;
  extrasEnabled: boolean;
  images: ProductImage[];
  sizes: ProductSize[];
  colorGroups: ProductColorGroup[];
  extras: ProductExtra[];
}

export interface UpsertProductImageRequest {
  url: string;
  colorTag: string | null;
}

export interface UpsertProductSizeRequest {
  name: string;
  description: string | null;
  price: number;
  discountedPrice: number | null;
}

export interface UpsertProductColorRequest {
  name: string;
  hexValue: string;
  soldOut: boolean;
}

export interface UpsertProductColorGroupRequest {
  name: string;
  sortOrder: number;
  colors: UpsertProductColorRequest[];
}

export interface UpsertProductExtraRequest {
  name: string;
  price: number;
}

export interface UpsertProductRequest {
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  description: string;
  descriptionEn: string | null;
  descriptionSq: string | null;
  basePrice: number;
  discountedPrice: number | null;
  categories: ProductCategory[];
  tags: string[];
  showcaseCategories: string[];
  soldOut: boolean;
  sizesEnabled: boolean;
  customSizeEnabled: boolean;
  customSizeUnitPrice: number | null;
  customSizeUnitLabel: string | null;
  customSizeBaseFee: number | null;
  extrasEnabled: boolean;
  images: UpsertProductImageRequest[];
  sizes: UpsertProductSizeRequest[];
  colorGroups: UpsertProductColorGroupRequest[];
  extras: UpsertProductExtraRequest[];
}
