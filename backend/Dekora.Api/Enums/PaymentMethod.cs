namespace Dekora.Api.Enums;

// Card is defined now so checkout/order code can branch on it, but no payment
// gateway is wired up yet (see handoff spec §6) — PayAtDelivery is the only
// method actually usable at launch.
public enum PaymentMethod
{
    PayAtDelivery,
    Card
}
