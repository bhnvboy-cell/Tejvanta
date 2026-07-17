using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Infrastructure.Persistence.Repositories;

public class OrderRepository
{
    private readonly AppDbContext _context;

    public OrderRepository(AppDbContext context) => _context = context;

    public async Task<PaperOrder> AddAsync(PaperOrder order)
    {
        _context.PaperOrders.Add(order);
        await _context.SaveChangesAsync();
        await _context.Entry(order).Reference(o => o.Instrument).LoadAsync();
        return order;
    }

    public async Task UpdateAsync(PaperOrder order)
    {
        order.UpdatedAt = DateTime.UtcNow;
        _context.PaperOrders.Update(order);
        await _context.SaveChangesAsync();
    }

    public async Task<PaperOrder?> GetByIdAsync(int id) =>
        await _context.PaperOrders.Include(o => o.Instrument).FirstOrDefaultAsync(o => o.Id == id);

    public async Task<List<PaperOrder>> GetByUserAsync(int userId) =>
        await _context.PaperOrders.Include(o => o.Instrument)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task<List<PaperOrder>> GetOpenByUserAsync(int userId) =>
        await _context.PaperOrders.Include(o => o.Instrument)
            .Where(o => o.UserId == userId && (o.Status == "PENDING" || o.Status == "OPEN" || o.Status == "PARTIALLY_FILLED"))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
}
