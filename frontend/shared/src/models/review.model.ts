// Open review system — no login or purchase required, per the approved product-page spec.
export interface CreateReviewRequest {
  productId: string;
  rating: number;
  text: string;
  reviewerName: string | null;
}

export interface Review {
  id: string;
  productId: string;
  reviewerName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface ReviewAdmin extends Review {
  productName: string;
}

export interface RatingBreakdown {
  rating: number;
  count: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  breakdown: RatingBreakdown[];
}
