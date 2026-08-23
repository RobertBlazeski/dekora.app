export interface FeaturedProduct {
  id: string;
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  primaryImageUrl: string | null;
  lowestPrice: number;
}

export interface HomepageContent {
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl: string | null;
  bannerCtaLabel: string | null;
  bannerCtaLink: string | null;
  promoBannerEnabled: boolean;
  promoBannerText: string | null;
  promoBannerLink: string | null;
  promoBannerEndsAt: string | null;
  // Always populated when promoBannerEnabled — either the owner's own end time, or the current
  // tick of the rolling 1-day default cycle. This is what the storefront should count down to.
  effectivePromoBannerEndsAt: string;
  featuredProduct: FeaturedProduct | null;
}

export interface UpdateHomepageContentRequest {
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl: string | null;
  bannerCtaLabel: string | null;
  bannerCtaLink: string | null;
  promoBannerEnabled: boolean;
  promoBannerText: string | null;
  promoBannerLink: string | null;
  promoBannerEndsAt: string | null;
  featuredProductId: string | null;
}
