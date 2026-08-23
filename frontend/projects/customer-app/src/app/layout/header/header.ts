import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ProductListItem, resolveAssetUrl, resolveProductName } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { SUPPORTED_LOCALES, Locale } from '../../i18n/locale';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CartService } from '../../core/cart/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { WishlistService } from '../../core/wishlist/wishlist.service';
import { ProductsApi } from '../../core/api/products.api';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductsApi);
  protected readonly translation = inject(TranslationService);
  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
  protected readonly wishlist = inject(WishlistService);

  protected readonly locales = SUPPORTED_LOCALES;

  protected readonly navLinks = [
    { path: 'shop', labelKey: 'nav.shop' },
    { path: 'faq', labelKey: 'nav.faq' },
  ];

  protected readonly searchOpen = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly searchResults = signal<ProductListItem[]>([]);
  protected readonly cartBumping = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  private previousCartCount = this.cart.itemCount();
  private searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const count = this.cart.itemCount();
      if (count !== this.previousCartCount) {
        this.previousCartCount = count;
        this.cartBumping.set(true);
        setTimeout(() => this.cartBumping.set(false), 450);
      }
    });
  }

  protected switchLanguage(locale: Locale): void {
    const segments = this.router.url.split('?')[0].split('/').filter(Boolean);
    segments[0] = locale;
    this.router.navigateByUrl('/' + segments.join('/'));
    this.mobileMenuOpen.set(false);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected openSearch(): void {
    this.searchOpen.set(true);
  }

  protected closeSearch(): void {
    this.searchOpen.set(false);
    this.searchTerm.set('');
    this.searchResults.set([]);
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchDebounceTimer);
    if (!value.trim()) {
      this.searchResults.set([]);
      return;
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.productsApi.getAll({ search: value }).subscribe((results) => this.searchResults.set(results.slice(0, 6)));
    }, 250);
  }

  protected goToProduct(productId: string): void {
    this.closeSearch();
    this.router.navigate(['/', this.translation.currentLocale(), 'product', productId]);
  }

  protected seeAllResults(): void {
    const term = this.searchTerm();
    this.closeSearch();
    this.router.navigate(['/', this.translation.currentLocale(), 'shop'], { queryParams: { q: term } });
  }

  protected trackOrderPath(): string[] {
    return ['/', this.translation.currentLocale(), this.auth.isLoggedIn() ? 'profile' : 'login'];
  }

  protected resolveImageUrl(url: string | null): string | null {
    return resolveAssetUrl(environment.apiUrl, url);
  }

  protected resolveName(product: ProductListItem): string {
    return resolveProductName(this.translation.currentLocale(), product);
  }
}
