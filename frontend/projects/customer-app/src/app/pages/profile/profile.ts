import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '@dekora/shared';
import { OrdersApi } from '../../core/api/orders.api';
import { BusinessRulesApi } from '../../core/api/business-rules.api';
import { AuthService } from '../../core/auth/auth.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-profile',
  imports: [TranslatePipe, RouterLink, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly auth = inject(AuthService);
  protected readonly translation = inject(TranslationService);
  private readonly ordersApi = inject(OrdersApi);
  private readonly businessRulesApi = inject(BusinessRulesApi);

  protected readonly pointsRedemptionMinimum = signal(300);
  protected readonly pointsRedemptionAmount = signal(180);
  protected readonly orders = signal<Order[]>([]);

  constructor() {
    this.businessRulesApi.get().subscribe((rules) => {
      this.pointsRedemptionMinimum.set(rules.pointsRedemptionMinimum);
      this.pointsRedemptionAmount.set(Math.round(rules.pointsRedemptionMinimum * rules.pointsRedemptionValue));
    });

    if (this.auth.isLoggedIn()) {
      this.ordersApi.getMine().subscribe((orders) => this.orders.set(orders));
      this.auth.refreshCurrentUser();
    }
  }
}
