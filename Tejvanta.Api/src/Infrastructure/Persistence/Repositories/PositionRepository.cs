using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Infrastructure.Persistence.Repositories;

public class PositionRepository
{
    private readonly AppDbContext _context;

    public PositionRepository(AppDbContext context) => _context = context;

    public async Task<PaperPosition?> GetByUserAndInstrumentAsync(int userId, int instrumentId) =>
        await _context.PaperPositions
            .Include(p => p.Instrument)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.InstrumentId == instrumentId);

    public async Task<List<PaperPosition>> GetByUserAsync(int userId) =>
        await _context.PaperPositions.Include(p => p.Instrument)
            .Where(p => p.UserId == userId && p.Quantity != 0)
            .ToListAsync();

    public async Task AddAsync(PaperPosition position)
    {
        _context.PaperPositions.Add(position);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(PaperPosition position)
    {
        position.UpdatedAt = DateTime.UtcNow;
        _context.PaperPositions.Update(position);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(PaperPosition position)
    {
        _context.PaperPositions.Remove(position);
        await _context.SaveChangesAsync();
    }
}
