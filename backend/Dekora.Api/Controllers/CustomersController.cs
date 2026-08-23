using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize(Roles = Roles.Admin)]
public class CustomersController(DekoraDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CustomerListItemDto>>> GetAll([FromQuery] string? search)
    {
        var query = db.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u =>
                u.FullName.Contains(search) ||
                (u.Email != null && u.Email.Contains(search)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));

        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
        var userIds = users.Select(u => u.Id).ToList();

        var orderStats = await db.Orders
            .Where(o => o.CustomerId != null && userIds.Contains(o.CustomerId.Value))
            .GroupBy(o => o.CustomerId!.Value)
            .Select(g => new { CustomerId = g.Key, Count = g.Count(), Total = g.Sum(o => o.Total) })
            .ToDictionaryAsync(g => g.CustomerId);

        var customers = users.Select(u =>
        {
            orderStats.TryGetValue(u.Id, out var stats);
            return new CustomerListItemDto(u.Id, u.FullName, u.Email!, u.PhoneNumber, u.Points, u.CreatedAt, stats?.Count ?? 0, stats?.Total ?? 0);
        }).ToList();

        return Ok(customers);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerDetailDto>> GetById(Guid id)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        var orders = await db.Orders.Where(o => o.CustomerId == id).ToListAsync();

        return Ok(new CustomerDetailDto(user.Id, user.FullName, user.Email!, user.PhoneNumber, user.Points, user.CreatedAt, orders.Count, orders.Sum(o => o.Total)));
    }
}
