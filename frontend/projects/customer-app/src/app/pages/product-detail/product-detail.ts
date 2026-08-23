import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ProductDetail as ProductDetailModel,
  ProductListItem,
  Review,
  SelectedColorChoice,
  resolveAssetUrl,
  resolveLocalizedText,
  resolveProductName,
} from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { ProductsApi } from '../../core/api/products.api';
import { ReviewsApi } from '../../core/api/reviews.api';
import { BusinessRulesApi } from '../../core/api/business-rules.api';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { WishlistService } from '../../core/wishlist/wishlist.service';
import { WishlistToastService } from '../../core/wishlist/wishlist-toast.service';
import { ProductCarousel } from '../../components/product-carousel/product-carousel';
import { ProductCard } from '../../components/product-card/product-card';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

type SizeMode = 'none' | 'fixed' | 'custom';

@Component({
  selector: 'app-product-detail',
  imports: [TranslatePipe, ProductCarousel, ProductCard, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductsApi);
  private readonly reviewsApi = inject(ReviewsApi);
  private readonly businessRulesApi = inject(BusinessRulesApi);
  private readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
  protected readonly wishlist = inject(WishlistService);
  private readonly wishlistToast = inject(WishlistToastService);
  protected readonly translation = inject(TranslationService);

  protected readonly product = signal<ProductDetailModel | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly alsoOrdered = signal<ProductListItem[]>([]);
  protected readonly trending = signal<ProductListItem[]>([]);
  protected readonly pointsEarnRate = signal(0.05);

  protected readonly displayName = computed(() => {
    const p = this.product();
    return p ? resolveProductName(this.translation.currentLocale(), p) : '';
  });

  protected readonly displayDescription = computed(() => {
    const p = this.product();
    if (!p) return '';
    return resolveLocalizedText(this.translation.currentLocale(), p.description, p.descriptionEn, p.descriptionSq);
  });

  // Open review system — anyone can leave a review, no login or purchase required.
  protected readonly reviewPopupOpen = signal(false);
  protected readonly hoverRating = signal(0);
  protected readonly reviewRating = signal(0);
  protected readonly reviewText = signal('');
  protected readonly reviewerName = signal('');
  protected readonly submittingReview = signal(false);
  protected readonly reviewSubmitted = signal(false);

  protected readonly selectedImageUrl = signal<string | null>(null);
  protected readonly sizeMode = signal<SizeMode>('none');
  protected readonly selectedSizeName = signal<string | null>(null);
  protected readonly customSizeQuantity = signal(1);
  // Keyed by color group name — one selection per group the product actually defines.
  protected readonly selectedColorByGroup = signal<Record<string, string>>({});
  protected readonly selectedExtraNames = signal<Set<string>>(new Set());
  protected readonly customText = signal('');
  protected readonly quantity = signal(1);
  protected readonly justAdded = signal(false);

  protected readonly averageRating = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    return Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10;
  });

  // Drives a fractional star fill (e.g. 4.75 → 95%) via a clipped overlay in the template,
  // rather than rounding to a whole star.
  protected readonly starFillPercent = computed(() => Math.max(0, Math.min(100, (this.averageRating() / 5) * 100)));

  // The regular (non-discounted) price for whatever's currently selected — used both to decide
  // if the current selection is on sale and to show the crossed-out price.
  protected readonly regularUnitPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    if (this.sizeMode() === 'fixed') {
      const size = p.sizes.find((s) => s.name === this.selectedSizeName());
      return size?.price ?? p.basePrice;
    }
    return p.basePrice;
  });

  protected readonly unitPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;

    let price: number;
    if (this.sizeMode() === 'custom') {
      price = (p.customSizeUnitPrice ?? 0) * this.customSizeQuantity() + (p.customSizeBaseFee ?? 0);
    } else {
      const size = p.sizes.find((s) => s.name === this.selectedSizeName());
      if (this.sizeMode() === 'fixed' && size) {
        price = size.discountedPrice ?? size.price;
      } else {
        price = p.discountedPrice ?? p.basePrice;
      }
    }

    for (const extraName of this.selectedExtraNames()) {
      const extra = p.extras.find((x) => x.name === extraName);
      if (extra) price += extra.price;
    }

    return price;
  });

  // Only the base/size price counts toward "is this discounted" — extras never are.
  protected readonly isCurrentSelectionDiscounted = computed(() => {
    if (this.sizeMode() === 'custom') return false;
    const p = this.product();
    if (!p) return false;
    if (this.sizeMode() === 'fixed') {
      const size = p.sizes.find((s) => s.name === this.selectedSizeName());
      return size?.discountedPrice != null && size.discountedPrice < size.price;
    }
    return p.discountedPrice != null && p.discountedPrice < p.basePrice;
  });

  protected readonly currentDiscountPercent = computed(() => {
    if (!this.isCurrentSelectionDiscounted()) return 0;
    const regular = this.regularUnitPrice();
    const discounted =
      this.sizeMode() === 'fixed'
        ? this.product()?.sizes.find((s) => s.name === this.selectedSizeName())?.discountedPrice
        : this.product()?.discountedPrice;
    if (!discounted || regular === 0) return 0;
    return Math.round((1 - discounted / regular) * 100);
  });

  protected readonly lineTotal = computed(() => this.unitPrice() * this.quantity());
  protected readonly pointsForThisOrder = computed(() => Math.round(this.lineTotal() * this.pointsEarnRate()));

  protected readonly selectedColorSoldOut = computed(() => {
    const p = this.product();
    if (!p) return false;
    const selections = this.selectedColorByGroup();
    return p.colorGroups.some((group) => {
      const chosenName = selections[group.name];
      if (!chosenName) return false;
      return group.colors.find((c) => c.name === chosenName)?.soldOut ?? false;
    });
  });

  protected readonly canAddToCart = computed(() => {
    const p = this.product();
    if (!p || p.soldOut || this.selectedColorSoldOut()) return false;
    if (p.sizesEnabled && this.sizeMode() === 'fixed' && !this.selectedSizeName()) return false;
    if (this.sizeMode() === 'custom' && this.customSizeQuantity() < 1) return false;
    return true;
  });

  constructor() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) return;

    this.businessRulesApi.get().subscribe((rules) => this.pointsEarnRate.set(rules.pointsEarnRate));

    this.productsApi.getById(productId).subscribe((product) => {
      this.product.set(product);
      this.selectedImageUrl.set(product.images[0]?.url ?? null);
      if (product.sizesEnabled) {
        this.sizeMode.set('fixed');
        // Sizes come back cheapest-first, so this pre-selects the lowest price rather than
        // leaving the customer looking at "Add to cart" with nothing chosen yet.
        this.selectedSizeName.set(product.sizes[0]?.name ?? null);
      } else if (product.customSizeEnabled) {
        this.sizeMode.set('custom');
      }
    });

    this.reviewsApi.getForProduct(productId).subscribe((reviews) => this.reviews.set(reviews));
    this.productsApi.getAlsoOrdered(productId).subscribe((products) => this.alsoOrdered.set(products));
    this.productsApi.getTrending().subscribe((products) => this.trending.set(products));
  }

  protected resolveUrl(url: string | null | undefined): string | null {
    return resolveAssetUrl(environment.apiUrl, url ?? null);
  }

  // The rating line under the title (and the "Write a review" button) both open the same popup —
  // open to anyone, no login or purchase required.
  protected openReviewPopup(): void {
    this.reviewRating.set(0);
    this.reviewText.set('');
    this.reviewerName.set(this.auth.currentUser()?.fullName ?? '');
    this.reviewPopupOpen.set(true);
  }

  protected closeReviewPopup(): void {
    this.reviewPopupOpen.set(false);
  }

  protected submitReview(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId || this.reviewRating() < 1) return;

    this.submittingReview.set(true);
    this.reviewsApi
      .create({
        productId,
        rating: this.reviewRating(),
        text: this.reviewText(),
        reviewerName: this.reviewerName().trim() || null,
      })
      .subscribe({
        next: (review) => {
          this.reviews.update((list) => [review, ...list]);
          this.reviewSubmitted.set(true);
          this.submittingReview.set(false);
          this.reviewPopupOpen.set(false);
        },
        error: () => {
          this.submittingReview.set(false);
        },
      });
  }

  // "Just now" for a review submitted this session, otherwise a short relative time.
  protected reviewDateLabel(review: Review): string {
    const seconds = Math.max(0, (Date.now() - new Date(review.createdAt).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  protected selectImage(url: string): void {
    this.selectedImageUrl.set(url);
  }

  protected selectSize(name: string): void {
    this.selectedSizeName.set(name);
  }

  protected selectColor(groupName: string, colorName: string): void {
    this.selectedColorByGroup.update((current) => {
      const next = { ...current };
      if (next[groupName] === colorName) delete next[groupName];
      else next[groupName] = colorName;
      return next;
    });
    const image = this.product()?.images.find((i) => i.colorTag === colorName);
    if (image) this.selectedImageUrl.set(image.url);
  }

  protected toggleExtra(name: string): void {
    const next = new Set(this.selectedExtraNames());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this.selectedExtraNames.set(next);
  }

  protected setSizeMode(mode: SizeMode): void {
    this.sizeMode.set(mode);
  }

  protected toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    const wasWishlisted = this.wishlist.has(p.id);
    this.wishlist.toggle(p.id);
    this.wishlistToast.show(this.displayName(), !wasWishlisted);
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p || !this.canAddToCart()) return;

    const selectedColors: SelectedColorChoice[] = Object.entries(this.selectedColorByGroup()).map(
      ([groupName, colorName]) => ({ groupName, colorName }),
    );

    this.cart.addItem({
      productId: p.id,
      productName: this.displayName(),
      imageUrl: this.selectedImageUrl(),
      unitPrice: this.unitPrice(),
      quantity: this.quantity(),
      selectedSize:
        this.sizeMode() === 'custom'
          ? `Custom (${this.customSizeQuantity()} x ${p.customSizeUnitLabel ?? ''})`
          : this.selectedSizeName(),
      selectedColors,
      customText: this.customText().trim() || null,
      selectedExtras: [...this.selectedExtraNames()],
      customSizeQuantity: this.sizeMode() === 'custom' ? this.customSizeQuantity() : null,
    });

    this.justAdded.set(true);
    setTimeout(() => this.justAdded.set(false), 2000);
  }
}
