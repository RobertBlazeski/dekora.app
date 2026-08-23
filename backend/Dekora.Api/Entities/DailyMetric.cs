namespace Dekora.Api.Entities;

public class DailyMetric
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public int VisitorCount { get; set; }
    public int OrderCount { get; set; }
    public int LoggedInCustomerCount { get; set; }
}
