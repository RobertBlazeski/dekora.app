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
  bannerTitleEn: string | null;
  bannerTitleSq: string | null;
  bannerSubtitle: string;
  bannerSubtitleEn: string | null;
  bannerSubtitleSq: string | null;
  bannerImageUrl: string | null;
  bannerCtaLabel: string | null;
  bannerCtaLabelEn: string | null;
  bannerCtaLabelSq: string | null;
  bannerCtaLink: string | null;
  promoBannerEnabled: boolean;
  promoBannerText: string | null;
  promoBannerTextEn: string | null;
  promoBannerTextSq: string | null;
  promoBannerLink: string | null;
  promoBannerEndsAt: string | null;
  // Always populated when promoBannerEnabled — either the owner's own end time, or the current
  // tick of the rolling 1-day default cycle. This is what the storefront should count down to.
  effectivePromoBannerEndsAt: string;
  featuredProduct: FeaturedProduct | null;
}

export interface UpdateHomepageContentRequest {
  bannerTitle: string;
  bannerTitleEn: string | null;
  bannerTitleSq: string | null;
  bannerSubtitle: string;
  bannerSubtitleEn: string | null;
  bannerSubtitleSq: string | null;
  bannerImageUrl: string | null;
  bannerCtaLabel: string | null;
  bannerCtaLabelEn: string | null;
  bannerCtaLabelSq: string | null;
  bannerCtaLink: string | null;
  promoBannerEnabled: boolean;
  promoBannerText: string | null;
  promoBannerTextEn: string | null;
  promoBannerTextSq: string | null;
  promoBannerLink: string | null;
  promoBannerEndsAt: string | null;
  featuredProductId: string | null;
}
