import { OrderStatus, PaymentMethod } from './enums';

export interface SelectedColorChoice {
  groupName: string;
  colorName: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColors?: SelectedColorChoice[] | null;
  customText?: string | null;
  selectedExtras?: string[] | null;
  // "{ExtraName}: {text}" for any selected extra that has its own custom-text box — kept
  // separate from selectedExtras since the server matches those against the product's extras
  // by exact name for pricing/validation.
  extraCustomTexts?: string[] | null;
  customSizeQuantity?: number | null;
  // The photo the customer had selected on the product page — must match one of that product's
  // own image URLs exactly or the server discards it (see OrdersController.BuildOrderItemsAsync).
  imageUrl?: string | null;
}

export interface CreateOrderRequest {
  customerName: string;
  phone: string;
  // Optional for a guest checkout — only logged-in customers are guaranteed to have one on
  // file, so requiring it from everyone blocked guest orders with no way to explain why.
  email: string | null;
  deliveryCity: string;
  deliveryAddress: string;
  note?: string | null;
  paymentMethod: PaymentMethod;
  pointsToRedeem: number;
  items: CreateOrderItemRequest[];
}

// The owner logging a phone/in-person sale from the admin dashboard — everything but the name
// and items is optional, and the owner picks the starting status directly since these are
// often already fulfilled by the time they're entered.
export interface CreateManualOrderRequest {
  customerName: string;
  phone?: string | null;
  email?: string | null;
  deliveryCity?: string | null;
  deliveryAddress?: string | null;
  note?: string | null;
  paymentMethod: PaymentMethod;
  initialStatus: OrderStatus;
  items: CreateOrderItemRequest[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  imageUrl: string | null;
  quantity: number;
  selectedSize: string | null;
  selectedColors: string[];
  customText: string | null;
  selectedExtras: string[];
  extraCustomTexts: string[];
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  phone: string;
  email: string;
  deliveryCity: string;
  deliveryAddress: string;
  subtotal: number;
  deliveryFee: number;
  pointsDiscount: number;
  total: number;
  pointsEarned: number;
  pointsSpent: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  note: string | null;
  isManualEntry: boolean;
  createdAt: string;
  statusUpdatedAt: string;
  items: OrderItem[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  // Product-only revenue — see OrderSummaryDto.Subtotal on the backend for why this, not
  // `total`, is what the orders list displays.
  subtotal: number;
  total: number;
  status: OrderStatus;
  isManualEntry: boolean;
  isViewed: boolean;
  createdAt: string;
}
