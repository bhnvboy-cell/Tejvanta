using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Infrastructure.Persistence.Repositories;

public class InstrumentRepository
{
    private readonly AppDbContext _context;

    public InstrumentRepository(AppDbContext context) => _context = context;

    public async Task<List<Instrument>> GetAllAsync() =>
        await _context.Instruments.Where(i => i.IsActive).ToListAsync();

    public async Task<Instrument?> GetByIdAsync(int id) =>
        await _context.Instruments.FindAsync(id);

    public async Task<Instrument?> GetBySymbolAsync(string symbol) =>
        await _context.Instruments.FirstOrDefaultAsync(i => i.Symbol == symbol && i.IsActive);

    public async Task<List<Instrument>> SearchAsync(string query) =>
        await _context.Instruments
            .Where(i => i.IsActive && (i.Symbol.Contains(query) || i.Name.Contains(query)))
            .Take(50)
            .ToListAsync();

    public async Task SeedInstrumentsAsync()
    {
        if (await _context.Instruments.AnyAsync()) return;

        var instruments = new List<Instrument>
        {
            new() { Symbol = "RELIANCE", Name = "Reliance Industries Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "TCS", Name = "Tata Consultancy Services Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "HDFCBANK", Name = "HDFC Bank Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "INFY", Name = "Infosys Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "ICICIBANK", Name = "ICICI Bank Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "SBIN", Name = "State Bank of India", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "BHARTIARTL", Name = "Bharti Airtel Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "ITC", Name = "ITC Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "WIPRO", Name = "Wipro Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "HINDUNILVR", Name = "Hindustan Unilever Ltd", Exchange = "NSE", Segment = "EQ", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "NIFTY", Name = "Nifty 50 Index", Exchange = "NSE", Segment = "INDEX", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "BANKNIFTY", Name = "Bank Nifty Index", Exchange = "NSE", Segment = "INDEX", TickSize = 0.05m, LotSize = 1 },
            new() { Symbol = "AAPL", Name = "Apple Inc", Exchange = "NASDAQ", Segment = "EQ", TickSize = 0.01m, LotSize = 1 },
            new() { Symbol = "MSFT", Name = "Microsoft Corporation", Exchange = "NASDAQ", Segment = "EQ", TickSize = 0.01m, LotSize = 1 },
            new() { Symbol = "GOOGL", Name = "Alphabet Inc", Exchange = "NASDAQ", Segment = "EQ", TickSize = 0.01m, LotSize = 1 },
            new() { Symbol = "BTC-USD", Name = "Bitcoin / USD", Exchange = "CRYPTO", Segment = "CRYPTO", TickSize = 0.1m, LotSize = 1 },
        };

        _context.Instruments.AddRange(instruments);
        await _context.SaveChangesAsync();
    }
}
