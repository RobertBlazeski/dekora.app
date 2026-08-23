import { SelectedColorChoice } from '@dekora/shared';

// Client-side only, per the handoff spec — the cart is never persisted server-side, only
// submitted as a whole at checkout (see CreateOrderRequest).
export interface CartItem {
  // Client-generated line id — distinct from productId, since the same product with
  // different size/color/extras is a separate line.
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  selectedSize: string | null;
  selectedColors: SelectedColorChoice[];
  customText: string | null;
  selectedExtras: string[];
  customSizeQuantity: number | null;
}
