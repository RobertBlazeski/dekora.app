namespace Dekora.Api.DTOs;

public record DeliveryCityDto(Guid Id, string Name, int SortOrder);

public record CreateDeliveryCityRequest(string Name);
