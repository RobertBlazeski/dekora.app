// Mirrors Dekora.Api.Enums — kept as string unions since the API serializes enums as strings.

// No longer a fixed enum — the owner can add categories from the admin product form, so this
// is just whatever name string a product/category happens to have. See models/category.model.ts
// for the canonical, admin-managed list.
export type ProductCategory = string;

export type OrderStatus =
  | 'PendingConfirmation'
  | 'Confirmed'
  | 'Preparing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'PayAtDelivery' | 'Card';
