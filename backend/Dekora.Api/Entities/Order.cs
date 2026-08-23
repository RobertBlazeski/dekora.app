using Dekora.Api.Enums;

namespace Dekora.Api.Entities;

public class Order
{
    public Guid Id { get; set; }

    // Display-friendly order number (e.g. short sequential code), distinct from the Guid Id.
    public string OrderNumber { get; set; } = string.Empty;

    // Nullable — guest orders are allowed and are not tied to a customer account.
    public Guid? CustomerId { get; set; }
    public ApplicationUser? Customer { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // A plain name picked from the owner-managed DeliveryCity list — stored denormalized (like
    // Product.Categories) so renaming/removing a city later never rewrites past orders.
    public string DeliveryCity { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal PointsDiscount { get; set; }
    public decimal Total { get; set; }

    public int PointsEarned { get; set; }
    public int PointsSpent { get; set; }

    public PaymentMethod PaymentMethod { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.PendingConfirmation;

    public string? Note { get; set; }

    // True for orders the owner entered themselves (phone/in-person sales) rather than ones a
    // customer placed through the site — lets total-income reporting include offline sales
    // without pretending they went through checkout.
    public bool IsManualEntry { get; set; }

    // Set the first time an admin opens this order's details — drives the "orders you missed"
    // stack and the unread badge on the admin sidebar. Null means still unseen.
    public DateTimeOffset? ViewedByAdminAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset StatusUpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<OrderItem> Items { get; set; } = new();
}
