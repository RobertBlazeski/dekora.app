namespace Dekora.Api.Services;

// Bound from the "BusinessRules" appsettings section. Keeps the values the spec calls out
// as final (delivery fee, points formula) as configuration rather than magic numbers.
public class BusinessRulesOptions
{
    public const string SectionName = "BusinessRules";

    public decimal DeliveryFee { get; set; } = 170m;
    public decimal PointsEarnRate { get; set; } = 0.05m;
    public int PointsRedemptionMinimum { get; set; } = 300;
    public decimal PointsRedemptionValue { get; set; } = 0.6m;
    public int ShippingMaxBusinessDays { get; set; } = 3;
}
