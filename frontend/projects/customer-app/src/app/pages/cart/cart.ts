import { LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { resolveAssetUrl } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { CartService } from '../../core/cart/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { BusinessRulesApi } from '../../core/api/business-rules.api';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-cart',
  imports: [TranslatePipe, RouterLink, LowerCasePipe],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
  protected readonly translation = inject(TranslationService);
  private readonly businessRulesApi = inject(BusinessRulesApi);

  protected readonly deliveryFee = signal(170);
  protected readonly pointsEarnRate = signal(0.05);

  protected readonly pointsEarned = computed(() => Math.round(this.cart.subtotal() * this.pointsEarnRate()));
  protected readonly total = computed(() => this.cart.subtotal() + this.deliveryFee());

  constructor() {
    this.businessRulesApi.get().subscribe((rules) => {
      this.deliveryFee.set(rules.deliveryFee);
      this.pointsEarnRate.set(rules.pointsEarnRate);
    });
  }

  protected decrement(id: string, currentQuantity: number): void {
    this.cart.updateQuantity(id, currentQuantity - 1);
  }

  protected increment(id: string, currentQuantity: number): void {
    this.cart.updateQuantity(id, currentQuantity + 1);
  }

  protected resolveUrl(url: string | null): string | null {
    return resolveAssetUrl(environment.apiUrl, url);
  }
}
