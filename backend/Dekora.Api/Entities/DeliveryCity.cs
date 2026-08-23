namespace Dekora.Api.Entities;

// The owner-managed list of delivery cities/municipalities customers can pick from at checkout,
// seeded with North Macedonia's major cities and extensible from the admin order form — same
// pattern as Category. Order.DeliveryCity stores the plain name (not a foreign key), so a past
// order keeps its city label even if this entry is later renamed or removed.
public class DeliveryCity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
