using Dekora.Api.Enums;

namespace Dekora.Api.DTOs;

// GroupName must match one of the product's ProductColorGroup names, ColorName one of the
// colors within that group.
public record SelectedColorChoiceRequest(string GroupName, string ColorName);

public record CreateOrderItemRequest(
    Guid ProductId,
    int Quantity,
    string? SelectedSize,
    List<SelectedColorChoiceRequest>? SelectedColors,
    string? CustomText,
    List<string>? SelectedExtras,
    // "{ExtraName}: {text}" for any selected extra with its own custom-text box — kept separate
    // from SelectedExtras since that list is matched against Product.Extras[].Name exactly for
    // pricing/validation (see OrdersController.BuildOrderItemsAsync), so it can't carry anything
    // extra without breaking that lookup.
    List<string>? ExtraCustomTexts,
    int? CustomSizeQuantity,
    // The photo the customer had selected on the product page — must match one of that
    // product's own image URLs exactly or it's discarded (see BuildOrderItemsAsync), so this
    // can't be used to sneak an arbitrary URL into what renders as an <img> in the admin panel.
    string? ImageUrl);

public record CreateOrderRequest(
    string CustomerName,
    string Phone,
    // Optional for a guest checkout — only a logged-in customer is guaranteed to have one on
    // file. Downstream code already treats a blank Order.Email as "no email" (see the
    // review-nudge email in OrdersController.UpdateStatus), so this needs no further plumbing.
    string? Email,
    string DeliveryCity,
    string DeliveryAddress,
    string? Note,
    PaymentMethod PaymentMethod,
    int PointsToRedeem,
    List<CreateOrderItemRequest> Items);

// For orders the owner enters themselves (phone/in-person sales) — contact details are all
// optional since a walk-in customer may only give a name, and the owner picks the starting
// status directly since these are often already fulfilled by the time they're logged.
public record CreateManualOrderRequest(
    string CustomerName,
    string? Phone,
    string? Email,
    string? DeliveryCity,
    string? DeliveryAddress,
    string? Note,
    PaymentMethod PaymentMethod,
    OrderStatus InitialStatus,
    List<CreateOrderItemRequest> Items);

public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductNameSnapshot,
    // The exact photo the customer had selected at order time (OrderItem.SelectedImageUrl) when
    // available — a real signal of what they wanted, e.g. which color variant — falling back to
    // the product's current primary image for manual orders or older orders placed before that
    // was captured. Null if the product's been deleted since and there's no snapshot either.
    string? ImageUrl,
    int Quantity,
    string? SelectedSize,
    IReadOnlyList<string> SelectedColors,
    string? CustomText,
    IReadOnlyList<string> SelectedExtras,
    IReadOnlyList<string> ExtraCustomTexts,
    decimal UnitPrice,
    decimal LineTotal);

public record OrderDto(
    Guid Id,
    string OrderNumber,
    Guid? CustomerId,
    string CustomerName,
    string Phone,
    string Email,
    string DeliveryCity,
    string DeliveryAddress,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal PointsDiscount,
    decimal Total,
    int PointsEarned,
    int PointsSpent,
    PaymentMethod PaymentMethod,
    OrderStatus Status,
    string? Note,
    bool IsManualEntry,
    DateTimeOffset CreatedAt,
    DateTimeOffset StatusUpdatedAt,
    IReadOnlyList<OrderItemDto> Items);

public record OrderSummaryDto(
    Guid Id,
    string OrderNumber,
    string CustomerName,
    // Product-only revenue — the figure the owner should read as "what this order is worth to
    // me." Total (below) also includes the delivery fee, which is never the owner's money (it's
    // either paid straight to the courier or waived for pickup), so leading the list with it
    // would silently inflate every revenue figure an owner reads at a glance.
    decimal Subtotal,
    decimal Total,
    OrderStatus Status,
    bool IsManualEntry,
    bool IsViewed,
    DateTimeOffset CreatedAt);

public record UpdateOrderStatusRequest(OrderStatus Status);
