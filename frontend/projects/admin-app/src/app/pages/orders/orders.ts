import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CreateManualOrderRequest, DeliveryCity, Order, OrderStatus, OrderSummary, PaymentMethod, ProductListItem, resolveAssetUrl } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { BusinessRulesApi } from '../../core/api/business-rules.api';
import { DeliveryCitiesApi } from '../../core/api/delivery-cities.api';
import { OrdersApi } from '../../core/api/orders.api';
import { ProductsApi } from '../../core/api/products.api';
import { OrderNotifications } from '../../core/orders/order-notifications.service';

const ORDER_STATUSES: OrderStatus[] = [
  'PendingConfirmation',
  'Confirmed',
  'Preparing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

interface ManualOrderLine {
  productId: string;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  selectedSize: string | null;
  availableSizes: string[];
}

function emptyManualForm() {
  return {
    customerName: '',
    phone: '',
    email: '',
    deliveryCity: '',
    deliveryAddress: '',
    note: '',
    paymentMethod: 'PayAtDelivery' as PaymentMethod,
    initialStatus: 'PendingConfirmation' as OrderStatus,
    includeDeliveryFee: true,
  };
}

@Component({
  selector: 'app-orders',
  imports: [DatePipe, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders {
  private readonly ordersApi = inject(OrdersApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly deliveryCitiesApi = inject(DeliveryCitiesApi);
  private readonly businessRulesApi = inject(BusinessRulesApi);
  private readonly notifications = inject(OrderNotifications);
  private readonly route = inject(ActivatedRoute);

  protected readonly deliveryFee = signal(0);

  protected readonly statuses = ORDER_STATUSES;
  protected readonly search = signal('');
  protected readonly statusFilter = signal<OrderStatus | ''>('');
  protected readonly orders = signal<OrderSummary[]>([]);

  protected readonly selectedOrder = signal<Order | null>(null);
  protected readonly updatingStatus = signal(false);

  // Manual order entry — for phone/in-person sales the owner wants included in income totals.
  protected readonly manualFormOpen = signal(false);
  protected readonly manualForm = signal(emptyManualForm());
  protected readonly manualLines = signal<ManualOrderLine[]>([]);
  protected readonly manualProductSearch = signal('');
  protected readonly allProducts = signal<ProductListItem[]>([]);
  protected readonly manualSaving = signal(false);
  protected readonly manualError = signal<string | null>(null);

  protected readonly deliveryCities = signal<DeliveryCity[]>([]);
  protected readonly newCityName = signal('');

  protected readonly productSearchResults = computed(() => {
    const term = this.manualProductSearch().trim().toLowerCase();
    if (!term) return [];
    return this.allProducts()
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.nameEn?.toLowerCase().includes(term) ?? false) ||
          (p.nameSq?.toLowerCase().includes(term) ?? false),
      )
      .slice(0, 8);
  });

  private searchDebounce: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const search = this.search();
      const status = this.statusFilter();
      this.ordersApi.getAll(status || undefined, search || undefined).subscribe((orders) => this.orders.set(orders));
    });

    // Coming from the toast stack or a "you missed this order" link elsewhere.
    const openId = this.route.snapshot.queryParamMap.get('open');
    if (openId) this.openDetails(openId);

    this.deliveryCitiesApi.getAll().subscribe((cities) => this.deliveryCities.set(cities));
    this.businessRulesApi.get().subscribe((rules) => this.deliveryFee.set(rules.deliveryFee));
  }

  protected addCity(): void {
    const name = this.newCityName().trim();
    if (!name) return;

    this.deliveryCitiesApi.create({ name }).subscribe((city) => {
      this.deliveryCities.update((list) => [...list, city].sort((a, b) => a.sortOrder - b.sortOrder));
      this.updateManualField('deliveryCity', city.name);
      this.newCityName.set('');
    });
  }

  protected onSearchInput(value: string): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.search.set(value), 300);
  }

  protected openDetails(orderId: string): void {
    this.ordersApi.getById(orderId).subscribe((order) => {
      this.selectedOrder.set(order);
      this.notifications.markViewedLocally(orderId);
      // Refresh the list in the background so its "unread" state matches immediately.
      this.ordersApi.getAll(this.statusFilter() || undefined, this.search() || undefined).subscribe((orders) => this.orders.set(orders));
    });
  }

  protected closeDetails(): void {
    this.selectedOrder.set(null);
  }

  protected updateStatus(status: OrderStatus): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.updatingStatus.set(true);
    this.ordersApi.updateStatus(order.id, status).subscribe(() => {
      this.selectedOrder.set({ ...order, status });
      this.updatingStatus.set(false);
      // Refresh the list in the background so the table/cards reflect the new status too.
      this.ordersApi.getAll(this.statusFilter() || undefined, this.search() || undefined).subscribe((orders) => this.orders.set(orders));
    });
  }

  protected openManualForm(): void {
    this.manualForm.set(emptyManualForm());
    this.manualLines.set([]);
    this.manualProductSearch.set('');
    this.manualError.set(null);
    this.manualFormOpen.set(true);
    if (this.allProducts().length === 0) {
      this.productsApi.getAll().subscribe((products) => this.allProducts.set(products));
    }
  }

  protected closeManualForm(): void {
    this.manualFormOpen.set(false);
  }

  protected updateManualField<K extends keyof ReturnType<typeof emptyManualForm>>(
    field: K,
    value: ReturnType<typeof emptyManualForm>[K],
  ): void {
    this.manualForm.update((f) => ({ ...f, [field]: value }));
  }

  protected addProductLine(product: ProductListItem): void {
    this.manualProductSearch.set('');
    if (this.manualLines().some((l) => l.productId === product.id)) return;

    this.productsApi.getById(product.id).subscribe((detail) => {
      this.manualLines.update((lines) => [
        ...lines,
        {
          productId: detail.id,
          productName: detail.name,
          imageUrl: detail.images[0]?.url ?? null,
          quantity: 1,
          selectedSize: detail.sizesEnabled && detail.sizes.length > 0 ? detail.sizes[0].name : null,
          availableSizes: detail.sizesEnabled ? detail.sizes.map((s) => s.name) : [],
        },
      ]);
    });
  }

  protected removeLine(productId: string): void {
    this.manualLines.update((lines) => lines.filter((l) => l.productId !== productId));
  }

  protected updateLineQuantity(productId: string, quantity: number): void {
    this.manualLines.update((lines) =>
      lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l)),
    );
  }

  protected updateLineSize(productId: string, size: string): void {
    this.manualLines.update((lines) => lines.map((l) => (l.productId === productId ? { ...l, selectedSize: size } : l)));
  }

  protected submitManualOrder(): void {
    const f = this.manualForm();
    if (!f.customerName.trim() || this.manualLines().length === 0) return;

    const request: CreateManualOrderRequest = {
      customerName: f.customerName,
      phone: f.phone || null,
      email: f.email || null,
      deliveryCity: f.deliveryCity || null,
      deliveryAddress: f.deliveryAddress || null,
      note: f.note || null,
      paymentMethod: f.paymentMethod,
      initialStatus: f.initialStatus,
      includeDeliveryFee: f.includeDeliveryFee,
      items: this.manualLines().map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        selectedSize: l.selectedSize,
        selectedColors: null,
        customText: null,
        selectedExtras: null,
        customSizeQuantity: null,
      })),
    };

    this.manualSaving.set(true);
    this.manualError.set(null);
    this.ordersApi.createManual(request).subscribe({
      next: () => {
        this.manualSaving.set(false);
        this.manualFormOpen.set(false);
        this.ordersApi.getAll(this.statusFilter() || undefined, this.search() || undefined).subscribe((orders) => this.orders.set(orders));
      },
      error: (err) => {
        this.manualSaving.set(false);
        this.manualError.set(err?.error?.detail ?? 'Could not save this order.');
      },
    });
  }

  protected resolveUrl(url: string | null): string | null {
    return resolveAssetUrl(environment.apiUrl, url);
  }
}
