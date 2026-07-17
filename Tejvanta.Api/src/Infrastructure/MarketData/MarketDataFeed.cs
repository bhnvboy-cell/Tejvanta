using System.Collections.Concurrent;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Tejvanta.Api.Infrastructure.MarketData;

public class MarketDataFeed : IMarketDataService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MarketDataFeed> _logger;
    private readonly ConcurrentDictionary<int, Tick> _latestTicks = new();
    private readonly ConcurrentDictionary<int, Timer> _simTimers = new();
    private CancellationTokenSource? _cts;
    private bool _disposed;

    public event Action<Tick>? OnTickReceived;

    public void PublishTick(Tick tick)
    {
        _latestTicks[tick.InstrumentId] = tick;
        OnTickReceived?.Invoke(tick);
    }

    public MarketDataFeed(IServiceScopeFactory scopeFactory, ILogger<MarketDataFeed> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<List<Candle>> GetOhlcAsync(int instrumentId, DateTime from, DateTime to, string timeframe)
    {
        using var scope = _scopeFactory.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await ctx.Candles
            .Where(c => c.InstrumentId == instrumentId && c.Timestamp >= from && c.Timestamp <= to && c.Timeframe == timeframe)
            .OrderBy(c => c.Timestamp)
            .ToListAsync();
    }

    public Task<Tick?> GetLatestTickAsync(int instrumentId)
    {
        _latestTicks.TryGetValue(instrumentId, out var tick);
        return Task.FromResult(tick);
    }

    public async Task<List<Instrument>> SearchInstrumentsAsync(string query)
    {
        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<Persistence.Repositories.InstrumentRepository>();
        return await repo.SearchAsync(query);
    }

    public async Task<List<Instrument>> GetAllInstrumentsAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<Persistence.Repositories.InstrumentRepository>();
        return await repo.GetAllAsync();
    }

    public async IAsyncEnumerable<Tick> StreamTicksAsync(int instrumentId)
    {
        var channel = System.Threading.Channels.Channel.CreateUnbounded<Tick>();
        Action<Tick> handler = tick =>
        {
            if (tick.InstrumentId == instrumentId)
                channel.Writer.TryWrite(tick);
        };
        OnTickReceived += handler;
        try
        {
            await foreach (var tick in channel.Reader.ReadAllAsync())
                yield return tick;
        }
        finally
        {
            OnTickReceived -= handler;
            channel.Writer.TryComplete();
        }
    }

    public async Task StartSimulationAsync(int intervalMs = 1000)
    {
        using var scope = _scopeFactory.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var instruments = await ctx.Instruments.Where(i => i.IsActive).ToListAsync();

        _cts = new CancellationTokenSource();

        foreach (var inst in instruments)
        {
            var seed = ComputeDeterministicHash(inst.Symbol);
            var rng = new Random(seed);
            var basePrice = inst.Symbol switch
            {
                "RELIANCE" => 2500m, "TCS" => 3500m, "HDFCBANK" => 1600m,
                "INFY" => 1450m, "ICICIBANK" => 1050m, "SBIN" => 650m,
                "BHARTIARTL" => 950m, "ITC" => 450m, "WIPRO" => 420m,
                "HINDUNILVR" => 2500m, "NIFTY" => 19500m, "BANKNIFTY" => 44000m,
                "AAPL" => 180m, "MSFT" => 380m, "GOOGL" => 140m,
                "BTC-USD" => 68000m,
                _ => 1000m
            };

            var price = basePrice;

            var timer = new Timer(_ =>
            {
                try
                {
                    if (_cts?.IsCancellationRequested == true) return;

                    var changePercent = (decimal)(rng.NextDouble() * 0.004 - 0.002);
                    price += price * changePercent;
                    price = Math.Round(price / inst.TickSize) * inst.TickSize;
                    if (price <= 0) price = inst.TickSize;

                    var tick = new Tick
                    {
                        InstrumentId = inst.Id,
                        Timestamp = DateTime.UtcNow,
                        Price = price,
                        Volume = rng.Next(100, 10000),
                        Bid = price - inst.TickSize,
                        Ask = price + inst.TickSize,
                        Open = basePrice,
                        High = price * 1.01m,
                        Low = price * 0.99m,
                        PrevClose = basePrice
                    };

                    _latestTicks[inst.Id] = tick;
                    OnTickReceived?.Invoke(tick);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in tick simulation for {Symbol}", inst.Symbol);
                }
            }, null, Random.Shared.Next(0, 5000), intervalMs + Random.Shared.Next(-200, 200));

            _simTimers[inst.Id] = timer;
        }

        _logger.LogInformation("Market data simulation started for {Count} instruments", instruments.Count);
    }

    public void StopSimulation()
    {
        _cts?.Cancel();
        foreach (var timer in _simTimers.Values)
            timer.Dispose();
        _simTimers.Clear();
        _logger.LogInformation("Market data simulation stopped");
    }

    private static int ComputeDeterministicHash(string str)
    {
        int hash = 5381;
        foreach (char c in str)
            hash = ((hash << 5) + hash) + c;
        return hash;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        StopSimulation();
        _cts?.Dispose();
    }
}
