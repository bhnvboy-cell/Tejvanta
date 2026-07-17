using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Domain.Services;

public interface IMarketDataService
{
    Task<List<Candle>> GetOhlcAsync(int instrumentId, DateTime from, DateTime to, string timeframe);
    Task<Tick?> GetLatestTickAsync(int instrumentId);
    Task<List<Instrument>> SearchInstrumentsAsync(string query);
    Task<List<Instrument>> GetAllInstrumentsAsync();
    IAsyncEnumerable<Tick> StreamTicksAsync(int instrumentId);
    event Action<Tick>? OnTickReceived;
}
