namespace Dekora.Api.Entities;

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public Guid ProductId { get; set; }

    // Snapshot fields: products can change (or be deleted) after the order is placed,
    // so the order must not depend on live product state.
    public string ProductNameSnapshot { get; set; } = string.Empty;
    public int Quantity { get; set; }

    public string? SelectedSize { get; set; }
    // Snapshot strings formatted "{GroupName}: {ColorName}" — one per color group the product
    // defined (e.g. "Box color: Blush", "Rose color: Ivory"). Flat list rather than fixed
    // fields since the set of color groups is owner-defined per product, not fixed.
    public List<string> SelectedColors { get; set; } = new();
    public string? CustomText { get; set; }
    public List<string> SelectedExtras { get; set; } = new();
    // "{ExtraName}: {text}" for any selected extra with its own custom-text box — see
    // CreateOrderItemRequest.ExtraCustomTexts for why this is separate from SelectedExtras.
    public List<string> ExtraCustomTexts { get; set; } = new();

    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }

    // The exact photo the customer was looking at when they added this to their cart (e.g. a
    // specific color variant) — a real signal of what they actually wanted, not just a "which
    // product is this" icon. Null for manual/owner-entered orders, or if the client didn't send
    // one; OrdersController falls back to the product's current primary photo in that case.
    public string? SelectedImageUrl { get; set; }
}
