namespace Dekora.Api.Entities;

// A small reusable palette the owner builds up while adding products — typing "Beige" once and
// saving it means every later color group can reuse the exact same hex value instead of the
// owner having to remember or re-eyeball it.
public class SavedColor
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string HexValue { get; set; } = string.Empty;
}
