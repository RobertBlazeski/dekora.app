namespace Dekora.Api.DTOs;

public record BusinessRulesDto(
    decimal DeliveryFee,
    decimal PointsEarnRate,
    int PointsRedemptionMinimum,
    decimal PointsRedemptionValue,
    int ShippingMaxBusinessDays);
