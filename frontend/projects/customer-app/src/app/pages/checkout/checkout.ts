import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CreateOrderItemRequest, DeliveryCity, Order, PaymentMethod } from '@dekora/shared';
import { BusinessRulesApi } from '../../core/api/business-rules.api';
import { DeliveryCitiesApi } from '../../core/api/delivery-cities.api';
import { OrdersApi } from '../../core/api/orders.api';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

const SAVED_DETAILS_KEY = 'dekora.last-order-details';

interface SavedOrderDetails {
  customerName: string;
  phone: string;
  deliveryCity: string;
  deliveryAddress: string;
}

// Not tied to a customer account — even guests get this, since remembering "where to deliver"
// is a browser-level convenience, not something that needs an account. Still fully editable;
// this only ever fills in a starting value.
function readSavedDetails(isBrowser: boolean): SavedOrderDetails | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(SAVED_DETAILS_KEY);
    return raw ? (JSON.parse(raw) as SavedOrderDetails) : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-checkout',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
  protected readonly translation = inject(TranslationService);
  private readonly businessRulesApi = inject(BusinessRulesApi);
  private readonly ordersApi = inject(OrdersApi);
  private readonly deliveryCitiesApi = inject(DeliveryCitiesApi);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly savedDetails = readSavedDetails(this.isBrowser);

  protected readonly deliveryCities = signal<DeliveryCity[]>([]);

  protected readonly deliveryFee = signal(0);
  protected readonly pointsEarnRate = signal(0.05);
  protected readonly pointsRedemptionMinimum = signal(300);
  protected readonly pointsRedemptionValue = signal(0.6);

  protected readonly confirmedOrder = signal<Order | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showMissingFieldsAlert = signal(false);

  private static readonly CONFETTI_COLORS = ['#E2635F', '#C97B92', '#7C9473', '#EFE4EE', '#F6E4E9'];
  protected readonly confettiPieces = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 7.3) % 100}%`,
    color: Checkout.CONFETTI_COLORS[i % Checkout.CONFETTI_COLORS.length],
    delay: `${(i % 6) * 0.08}s`,
    rotate: `${(i * 47) % 360}deg`,
  }));

  protected readonly form = new FormGroup({
    customerName: new FormControl(this.auth.currentUser()?.fullName ?? this.savedDetails?.customerName ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phone: new FormControl(this.auth.currentUser()?.phone ?? this.savedDetails?.phone ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    // Only a logged-in customer is guaranteed to have an email on file — requiring it from a
    // guest blocked checkout with no way for them to tell why. Validators.email itself already
    // treats an empty value as valid, so a guest who does type something still gets format
    // feedback; only the required-ness differs.
    email: new FormControl(this.auth.currentUser()?.email ?? '', {
      nonNullable: true,
      validators: this.auth.isLoggedIn() ? [Validators.required, Validators.email] : [Validators.email],
    }),
    deliveryCity: new FormControl(this.savedDetails?.deliveryCity ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    deliveryAddress: new FormControl(this.savedDetails?.deliveryAddress ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    note: new FormControl('', { nonNullable: true }),
    paymentMethod: new FormControl<PaymentMethod>('PayAtDelivery', { nonNullable: true }),
    redeemPoints: new FormControl(false, { nonNullable: true }),
  });

  protected readonly availablePoints = computed(() => this.auth.currentUser()?.points ?? 0);
  protected readonly canRedeemPoints = computed(() => this.availablePoints() >= this.pointsRedemptionMinimum());

  private readonly redeemPointsInput = toSignal(this.form.controls.redeemPoints.valueChanges, {
    initialValue: false,
  });

  // Toggling "use my points" redeems the full available balance — no manual amount entry.
  protected readonly pointsToRedeem = computed(() =>
    this.redeemPointsInput() && this.canRedeemPoints() ? this.availablePoints() : 0,
  );

  protected readonly pointsDiscount = computed(() => this.pointsToRedeem() * this.pointsRedemptionValue());
  protected readonly pointsEarned = computed(() => Math.round(this.cart.subtotal() * this.pointsEarnRate()));

  // Mirrors the backend exactly (see OrdersController.Create): redeeming points rounds the
  // total to the nearest 100 ден, since payment is cash-on-delivery — this is only the preview
  // shown before submit, the real total is always whatever the server actually charges.
  protected readonly total = computed(() => {
    const raw = Math.max(0, this.cart.subtotal() + this.deliveryFee() - this.pointsDiscount());
    return this.pointsToRedeem() > 0 ? Math.round(raw / 100) * 100 : raw;
  });

  constructor() {
    this.businessRulesApi.get().subscribe((rules) => {
      this.deliveryFee.set(rules.deliveryFee);
      this.pointsEarnRate.set(rules.pointsEarnRate);
      this.pointsRedemptionMinimum.set(rules.pointsRedemptionMinimum);
      this.pointsRedemptionValue.set(rules.pointsRedemptionValue);
    });

    // A stale/expired session (JWT lifetime is 7 days) would otherwise only surface after
    // placing the order — order creation is a public endpoint, so an invalid token doesn't
    // reject the request, it just silently falls back to an anonymous guest order (no points
    // earned, nothing saved to "my orders"). Refreshing here forces that check up front: if the
    // token's actually invalid the interceptor logs the customer out immediately, before they
    // fill out the form believing they're earning points on an order that won't be theirs.
    if (this.auth.isLoggedIn()) this.auth.refreshCurrentUser();

    this.deliveryCitiesApi.getAll().subscribe((cities) => this.deliveryCities.set(cities));

    // localStorage only remembers details on the same browser/device. A logged-in customer's
    // own order history is the more reliable source, so it wins once it loads — but only into
    // fields the customer hasn't already touched (in case they typed something in first).
    if (this.auth.isLoggedIn()) {
      this.ordersApi.getMine().subscribe((orders) => {
        const last = orders[0];
        if (!last) return;
        if (!this.form.controls.phone.dirty && last.phone) this.form.controls.phone.setValue(last.phone);
        if (!this.form.controls.deliveryCity.dirty && last.deliveryCity) {
          this.form.controls.deliveryCity.setValue(last.deliveryCity);
        }
        if (!this.form.controls.deliveryAddress.dirty && last.deliveryAddress) {
          this.form.controls.deliveryAddress.setValue(last.deliveryAddress);
        }
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid || this.cart.cartItems().length === 0) {
      this.form.markAllAsTouched();
      this.flashMissingFieldsAlert();
      return;
    }

    const items: CreateOrderItemRequest[] = this.cart.cartItems().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      selectedColors: item.selectedColors,
      customText: item.customText,
      selectedExtras: item.selectedExtras,
      extraCustomTexts: item.extraCustomTexts,
      customSizeQuantity: item.customSizeQuantity,
      imageUrl: item.imageUrl,
    }));

    const value = this.form.getRawValue();

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.ordersApi
      .create({
        customerName: value.customerName,
        phone: value.phone,
        email: value.email || null,
        deliveryCity: value.deliveryCity,
        deliveryAddress: value.deliveryAddress,
        note: value.note || null,
        paymentMethod: value.paymentMethod,
        pointsToRedeem: this.pointsToRedeem(),
        items,
      })
      .subscribe({
        next: (order) => {
          this.saveDetailsForNextTime();
          this.cart.clear();
          this.confirmedOrder.set(order);
          this.submitting.set(false);
          if (this.auth.isLoggedIn()) this.auth.refreshCurrentUser();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.detail ?? null);
          this.submitting.set(false);
        },
      });
  }

  // Marking fields red on their own is easy to miss on a long form, especially on a phone where
  // the invalid field might be scrolled off-screen — the banner plus a jump to the first
  // offender is what actually tells the customer why nothing happened when they tapped submit.
  private flashMissingFieldsAlert(): void {
    this.showMissingFieldsAlert.set(true);
    setTimeout(() => this.showMissingFieldsAlert.set(false), 4000);

    if (!this.isBrowser) return;
    const firstInvalidName = Object.keys(this.form.controls).find(
      (name) => this.form.get(name)?.invalid,
    );
    if (!firstInvalidName) return;
    const el = document.getElementById(firstInvalidName);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  }

  private saveDetailsForNextTime(): void {
    if (!this.isBrowser) return;
    const value = this.form.getRawValue();
    const details: SavedOrderDetails = {
      customerName: value.customerName,
      phone: value.phone,
      deliveryCity: value.deliveryCity,
      deliveryAddress: value.deliveryAddress,
    };
    localStorage.setItem(SAVED_DETAILS_KEY, JSON.stringify(details));
  }
}
