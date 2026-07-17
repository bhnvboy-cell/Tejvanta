using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Infrastructure.Persistence;
using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WatchlistController : ControllerBase
{
    private readonly AppDbContext _context;

    public WatchlistController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult> GetWatchlist()
    {
        var watchlist = await _context.Watchlists
            .Include(w => w.Items.OrderBy(i => i.SortOrder))
            .ThenInclude(i => i.Instrument)
            .FirstOrDefaultAsync(w => w.UserId == 1);

        if (watchlist == null) return Ok(new { items = new List<object>() });

        return Ok(new
        {
            watchlist.Id,
            watchlist.Name,
            Items = watchlist.Items.Select(i => new
            {
                i.Id,
                i.InstrumentId,
                i.SortOrder,
                Symbol = i.Instrument?.Symbol ?? "",
                Name = i.Instrument?.Name ?? ""
            })
        });
    }

    public record AddSymbolRequest(int InstrumentId);

    [HttpPost("add")]
    public async Task<ActionResult> AddSymbol([FromBody] AddSymbolRequest request)
    {
        var watchlist = await _context.Watchlists
            .Include(w => w.Items)
            .FirstOrDefaultAsync(w => w.UserId == 1);

        if (watchlist == null)
        {
            watchlist = new Watchlist { UserId = 1, Name = "Default" };
            _context.Watchlists.Add(watchlist);
            await _context.SaveChangesAsync();
        }

        if (watchlist.Items.Any(i => i.InstrumentId == request.InstrumentId))
            return Ok(new { message = "Already in watchlist" });

        var maxOrder = watchlist.Items.Count > 0 ? watchlist.Items.Max(i => i.SortOrder) : 0;
        watchlist.Items.Add(new WatchlistItem
        {
            InstrumentId = request.InstrumentId,
            SortOrder = maxOrder + 1
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Added" });
    }

    [HttpDelete("remove/{instrumentId}")]
    public async Task<ActionResult> RemoveSymbol(int instrumentId)
    {
        var item = await _context.WatchlistItems
            .FirstOrDefaultAsync(i => i.InstrumentId == instrumentId &&
                _context.Watchlists.Any(w => w.Id == i.WatchlistId && w.UserId == 1));

        if (item == null) return NotFound();
        _context.WatchlistItems.Remove(item);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Removed" });
    }
}
