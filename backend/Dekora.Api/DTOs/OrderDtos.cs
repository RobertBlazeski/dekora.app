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
    int? CustomSizeQuantity);

public record CreateOrderRequest(
    string CustomerName,
    string Phone,
    string Email,
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
    // The product's current primary image, not a snapshot from order time — good enough for
    // "which product is this" at a glance (the point of showing it), and simpler than storing
    // a historical copy. Null if the product's been deleted since.
    string? ImageUrl,
    int Quantity,
    string? SelectedSize,
    IReadOnlyList<string> SelectedColors,
    string? CustomText,
    IReadOnlyList<string> SelectedExtras,
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
    decimal Total,
    OrderStatus Status,
    bool IsManualEntry,
    bool IsViewed,
    DateTimeOffset CreatedAt);

public record UpdateOrderStatusRequest(OrderStatus Status);
