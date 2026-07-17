using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Infrastructure.Persistence.Repositories;

public class OptionsRepository
{
    private readonly AppDbContext _context;

    public OptionsRepository(AppDbContext context) => _context = context;

    public async Task<List<OptionsContract>> GetChainAsync(int underlyingId, DateTime expiry) =>
        await _context.OptionsContracts
            .Where(o => o.UnderlyingInstrumentId == underlyingId && o.Expiry.Date == expiry.Date)
            .OrderBy(o => o.Strike)
            .ThenBy(o => o.OptionType)
            .ToListAsync();

    public async Task<List<DateTime>> GetExpiriesAsync(int underlyingId) =>
        await _context.OptionsContracts
            .Where(o => o.UnderlyingInstrumentId == underlyingId)
            .Select(o => o.Expiry.Date)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();

    public async Task SeedOptionsAsync(int underlyingId)
    {
        if (await _context.OptionsContracts.AnyAsync(o => o.UnderlyingInstrumentId == underlyingId)) return;

        var underlying = await _context.Instruments.FindAsync(underlyingId);
        if (underlying == null) return;

        decimal basePrice = underlying.Symbol switch
        {
            "RELIANCE" => 2500m,
            "NIFTY" => 19500m,
            "BANKNIFTY" => 44000m,
            "HDFCBANK" => 1600m,
            "TCS" => 3500m,
            _ => 1000m
        };

        var today = DateTime.UtcNow.Date;
        var daysUntilThursday = ((int)DayOfWeek.Thursday - (int)today.DayOfWeek + 7) % 7;
        if (daysUntilThursday == 0) daysUntilThursday = 7;
        var nextThursday = today.AddDays(daysUntilThursday);
        var expiries = new[] {
            nextThursday,
            nextThursday.AddDays(7),
            nextThursday.AddDays(28)
        };

        var contracts = new List<OptionsContract>();
        foreach (var expiry in expiries)
        {
            for (int i = -5; i <= 5; i++)
            {
                var strike = Math.Round(basePrice / 50) * 50 + (i * 50);
                var callPrice = Math.Max(1, basePrice > strike ? (basePrice - strike) * 0.5m : 10 + i * 2);
                var putPrice = Math.Max(1, basePrice < strike ? (strike - basePrice) * 0.5m : 10 - i * 2);

                contracts.Add(new OptionsContract
                {
                    UnderlyingInstrumentId = underlyingId,
                    Strike = strike,
                    Expiry = expiry,
                    OptionType = "CE",
                    LTP = Math.Round(callPrice, 2),
                    Bid = Math.Round(callPrice - 0.5m, 2),
                    Ask = Math.Round(callPrice + 0.5m, 2),
                    OpenInterest = Random.Shared.Next(100000, 5000000),
                    Volume = Random.Shared.Next(1000, 50000),
                    IV = Random.Shared.Next(12, 25),
                    Change = Math.Round((decimal)(Random.Shared.NextDouble() * 10 - 5), 2),
                    ChangePercent = Math.Round((decimal)(Random.Shared.NextDouble() * 2 - 1), 2),
                });

                contracts.Add(new OptionsContract
                {
                    UnderlyingInstrumentId = underlyingId,
                    Strike = strike,
                    Expiry = expiry,
                    OptionType = "PE",
                    LTP = Math.Round(putPrice, 2),
                    Bid = Math.Round(putPrice - 0.5m, 2),
                    Ask = Math.Round(putPrice + 0.5m, 2),
                    OpenInterest = Random.Shared.Next(100000, 5000000),
                    Volume = Random.Shared.Next(1000, 50000),
                    IV = Random.Shared.Next(12, 25),
                    Change = Math.Round((decimal)(Random.Shared.NextDouble() * 10 - 5), 2),
                    ChangePercent = Math.Round((decimal)(Random.Shared.NextDouble() * 2 - 1), 2),
                });
            }
        }

        _context.OptionsContracts.AddRange(contracts);
        await _context.SaveChangesAsync();
    }
}
