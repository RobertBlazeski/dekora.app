using Dekora.Api.DTOs;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Dekora.Api.Controllers;

// Public read-only endpoint so the frontend can show accurate delivery fee / points figures
// (checkout preview, cart summary) without duplicating these as hardcoded constants — the
// server in OrdersController remains the sole authority that actually applies them.
[ApiController]
[Route("api/business-rules")]
public class BusinessRulesController(IOptions<BusinessRulesOptions> options) : ControllerBase
{
    [HttpGet]
    public ActionResult<BusinessRulesDto> Get()
    {
        var r = options.Value;
        return Ok(new BusinessRulesDto(r.DeliveryFee, r.PointsEarnRate, r.PointsRedemptionMinimum, r.PointsRedemptionValue, r.ShippingMaxBusinessDays));
    }
}
