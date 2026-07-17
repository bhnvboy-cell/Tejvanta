using System.Collections.Concurrent;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Tejvanta.Api.Infrastructure.Replay;

public class ReplayService : IReplayService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReplayService> _logger;
    private readonly ConcurrentDictionary<int, ReplaySession> _sessions = new();

    public event Action<Tick>? OnReplayTick;
    public event Action<ReplayState>? OnReplayStateChanged;
    public event Action<ReplayCandle>? OnReplayCandleCompleted;

    public ReplayService(IServiceScopeFactory scopeFactory, ILogger<ReplayService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartReplayAsync(int instrumentId, DateTime from, DateTime to, double speed = 1.0)
    {
        if (_sessions.ContainsKey(instrumentId))
            await StopReplayAsync(instrumentId);

        using var scope = _scopeFactory.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var instrument = await ctx.Instruments.FindAsync(instrumentId);
        var symbol = instrument?.Symbol ?? "NIFTY";

        var candles = await ctx.Candles
            .Where(c => c.InstrumentId == instrumentId && c.Timestamp >= from && c.Timestamp <= to && c.Timeframe == "1m")
            .OrderBy(c => c.Timestamp)
            .ToListAsync();

        List<ReplayCandle> candleList;
        var ticks = GenerateTicksFromCandles(candles, out candleList);
        if (ticks.Count == 0)
        {
            ticks = GenerateSimulatedTicks(instrumentId, symbol, from, to, out candleList);
        }

        var session = new ReplaySession
        {
            InstrumentId = instrumentId,
            Ticks = ticks,
            Candles = candleList,
            CurrentIndex = 0,
            Speed = speed,
            IsPlaying = true,
            From = from,
            To = to,
            State = new ReplayState
            {
                InstrumentId = instrumentId,
                IsPlaying = true,
                CurrentTime = from,
                From = from,
                To = to,
                Speed = speed,
                TickCount = ticks.Count,
                ProgressPercent = 0,
            }
        };

        _sessions[instrumentId] = session;
        _ = Task.Run(() => ProcessReplayAsync(session));

        OnReplayStateChanged?.Invoke(session.State);
        _logger.LogInformation("Replay started for instrument {Id}: {From} to {To}", instrumentId, from, to);
    }

    public Task StopReplayAsync(int instrumentId)
    {
        if (_sessions.TryRemove(instrumentId, out var session))
        {
            session.Cts.Cancel();
            session.State.IsPlaying = false;
            OnReplayStateChanged?.Invoke(session.State);
            _logger.LogInformation("Replay stopped for instrument {Id}", instrumentId);
        }
        return Task.CompletedTask;
    }

    public Task PauseReplayAsync(int instrumentId)
    {
        if (_sessions.TryGetValue(instrumentId, out var session))
        {
            session.IsPlaying = false;
            session.State.IsPlaying = false;
            OnReplayStateChanged?.Invoke(session.State);
        }
        return Task.CompletedTask;
    }

    public Task ResumeReplayAsync(int instrumentId)
    {
        if (_sessions.TryGetValue(instrumentId, out var session))
        {
            session.IsPlaying = true;
            session.State.IsPlaying = true;
            OnReplayStateChanged?.Invoke(session.State);
        }
        return Task.CompletedTask;
    }

    public bool IsReplaying(int instrumentId) =>
        _sessions.ContainsKey(instrumentId) && _sessions[instrumentId].IsPlaying;

    public ReplayState GetReplayState(int instrumentId) =>
        _sessions.TryGetValue(instrumentId, out var session) ? session.State : new ReplayState();

    private async Task ProcessReplayAsync(ReplaySession session)
    {
        try
        {
            var prevMinute = -1;

            while (session.CurrentIndex < session.Ticks.Count && !session.Cts.IsCancellationRequested)
            {
                if (!session.IsPlaying)
                {
                    await Task.Delay(100, session.Cts.Token);
                    continue;
                }

                var tick = session.Ticks[session.CurrentIndex];
                _logger.LogDebug("ProcessReplay tick #{Idx}: Price={Price}, Time={Time}", session.CurrentIndex, tick.Price, tick.Timestamp);
                OnReplayTick?.Invoke(tick);

                session.State.CurrentTime = tick.Timestamp;
                session.State.TickCount = session.CurrentIndex + 1;
                session.State.ProgressPercent = (double)(session.CurrentIndex + 1) / session.Ticks.Count * 100;

                var currentMinute = tick.Timestamp.Minute + tick.Timestamp.Hour * 60;

                if (prevMinute >= 0 && currentMinute != prevMinute)
                {
                    EmitCompletedCandle(session, session.CurrentIndex - 1);
                }

                prevMinute = currentMinute;

                var delayMs = (int)(1000.0 / session.Speed);
                await Task.Delay(Math.Max(10, delayMs), session.Cts.Token);

                session.CurrentIndex++;
            }

            if (session.CurrentIndex >= session.Ticks.Count)
            {
                if (session.Ticks.Count > 0)
                    EmitCompletedCandle(session, session.Ticks.Count - 1);

                session.State.IsPlaying = false;
                OnReplayStateChanged?.Invoke(session.State);
            }
        }
        catch (TaskCanceledException) { }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in replay processing for instrument {Id}", session.InstrumentId);
        }
    }

    private void EmitCompletedCandle(ReplaySession session, int tickIndex)
    {
        var tickTime = session.Ticks[tickIndex].Timestamp;
        var matched = session.Candles.FirstOrDefault(c =>
            c.Timestamp.Year == tickTime.Year &&
            c.Timestamp.Month == tickTime.Month &&
            c.Timestamp.Day == tickTime.Day &&
            c.Timestamp.Hour == tickTime.Hour &&
            c.Timestamp.Minute == tickTime.Minute);

        if (matched != null)
        {
            _logger.LogDebug("Candle completed at {Time}: O={O}, H={H}, L={L}, C={C}",
                matched.Timestamp, matched.Open, matched.High, matched.Low, matched.Close);
            OnReplayCandleCompleted?.Invoke(matched);
        }
    }

    private List<Tick> GenerateTicksFromCandles(List<Candle> candles, out List<ReplayCandle> candleList)
    {
        var ticks = new List<Tick>();
        candleList = new List<ReplayCandle>();
        decimal? prevClose = null;

        foreach (var candle in candles)
        {
            var openPrice = candle.Open;
            var closePrice = candle.Close;
            var range = (double)(candle.High - candle.Low);

            // Tick 1: at open time, at open price
            ticks.Add(new Tick
            {
                InstrumentId = candle.InstrumentId,
                Timestamp = candle.Timestamp,
                Price = openPrice,
                Volume = Math.Max(1, candle.Volume / 10),
                Open = candle.Open,
                High = candle.High,
                Low = candle.Low,
                PrevClose = prevClose ?? openPrice,
            });

            // Tick 2: mid-point at a random price within the candle range
            if (range > 0)
            {
                var midTick = candle.Timestamp.AddSeconds(30);
                var midPrice = Math.Round(candle.Low + (decimal)(Random.Shared.NextDouble() * range), 2);
                ticks.Add(new Tick
                {
                    InstrumentId = candle.InstrumentId,
                    Timestamp = midTick,
                    Price = midPrice,
                    Volume = Math.Max(1, candle.Volume / 10),
                    Open = candle.Open,
                    High = candle.High,
                    Low = candle.Low,
                    PrevClose = prevClose ?? openPrice,
                });
            }

            // Tick 3: at near the end of the minute, at close price
            var closeTick = candle.Timestamp.AddSeconds(59);
            ticks.Add(new Tick
            {
                InstrumentId = candle.InstrumentId,
                Timestamp = closeTick,
                Price = closePrice,
                Volume = Math.Max(1, candle.Volume / 10),
                Open = candle.Open,
                High = candle.High,
                Low = candle.Low,
                PrevClose = prevClose ?? openPrice,
            });

            candleList.Add(new ReplayCandle
            {
                InstrumentId = candle.InstrumentId,
                Timestamp = candle.Timestamp,
                Open = candle.Open,
                High = candle.High,
                Low = candle.Low,
                Close = candle.Close,
            });

            prevClose = candle.Close;
        }
        return ticks;
    }

    private static List<Tick> GenerateSimulatedTicks(int instrumentId, string symbol, DateTime from, DateTime to, out List<ReplayCandle> candleList)
    {
        var ticks = new List<Tick>();
        candleList = new List<ReplayCandle>();
        var current = from;
        var rng = new Random(instrumentId);

        var basePrice = SymbolBasePrice(symbol);
        var price = basePrice + (decimal)(rng.NextDouble() * 200 - 100);

        while (current <= to)
        {
            var volatility = (double)price * 0.003;
            var change = (decimal)(rng.NextDouble() * volatility * 2 - volatility);
            var open = price;
            var close = Math.Max(1, Math.Round(price + change, 2));
            var high = Math.Max(open, close) + Math.Abs(change) * 0.3m;
            var low = Math.Min(open, close) - Math.Abs(change) * 0.3m;

            ticks.Add(new Tick
            {
                InstrumentId = instrumentId,
                Timestamp = current,
                Price = close,
                Volume = rng.Next(100, 5000),
                Open = open,
                High = high,
                Low = low,
                PrevClose = price,
            });

            candleList.Add(new ReplayCandle
            {
                InstrumentId = instrumentId,
                Timestamp = current,
                Open = open,
                High = Math.Round(high, 2),
                Low = Math.Round(low, 2),
                Close = close,
            });

            price = close;
            current = current.AddMinutes(1);
        }
        return ticks;
    }

    private static decimal SymbolBasePrice(string symbol) => symbol.ToUpperInvariant() switch
    {
        "NIFTY" => 19500m,
        "BANKNIFTY" => 44000m,
        "RELIANCE" => 2500m,
        "TCS" => 3500m,
        "HDFCBANK" => 1600m,
        "INFY" => 1450m,
        "ICICIBANK" => 1050m,
        "SBIN" => 650m,
        "BHARTIARTL" => 950m,
        "ITC" => 450m,
        "WIPRO" => 420m,
        "HINDUNILVR" => 2500m,
        "AAPL" => 180m,
        "MSFT" => 380m,
        "GOOGL" => 140m,
        _ => 1000m,
    };

    public void Dispose()
    {
        foreach (var kvp in _sessions)
        {
            kvp.Value.Cts.Cancel();
            kvp.Value.Cts.Dispose();
        }
        _sessions.Clear();
    }

    private class ReplaySession
    {
        public int InstrumentId { get; set; }
        public List<Tick> Ticks { get; set; } = new();
        public List<ReplayCandle> Candles { get; set; } = new();
        public int CurrentIndex { get; set; }
        public double Speed { get; set; }
        public bool IsPlaying { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public CancellationTokenSource Cts { get; set; } = new();
        public ReplayState State { get; set; } = new();
    }
}
