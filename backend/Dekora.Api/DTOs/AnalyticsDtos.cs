namespace Dekora.Api.DTOs;

// VisitorCount comes from the real (lightweight) page-visit ping — see AnalyticsController's
// RecordVisit. OrderCount/LoggedInCustomerCount are computed live from Orders on every read
// rather than trusted from a stored column, so they're never stale.
public record DailyMetricDto(DateOnly Date, int VisitorCount, int OrderCount, int LoggedInCustomerCount);

public record DailySalesDto(DateOnly Date, int OrderCount, decimal Revenue);

public record CategorySalesDto(string Category, int OrderCount, decimal Revenue);

public record TopProductDto(Guid ProductId, string ProductName, int QuantitySold, decimal Revenue);

public record AnalyticsOverviewDto(
    int TotalOrders,
    decimal TotalRevenue,
    int TotalCustomers,
    int PendingOrders,
    decimal AverageOrderValue,
    decimal SalesToday,
    int VisitorsToday);
