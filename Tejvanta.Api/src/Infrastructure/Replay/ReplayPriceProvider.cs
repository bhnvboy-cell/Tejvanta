using System.Collections.Concurrent;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.Infrastructure.Replay;

public class ReplayPriceProvider : IReplayPriceProvider
{
    private readonly ConcurrentDictionary<int, decimal> _prices = new();

    public decimal? GetCurrentPrice(int instrumentId)
    {
        return _prices.TryGetValue(instrumentId, out var price) ? price : null;
    }

    public void UpdatePrice(int instrumentId, decimal price)
    {
        _prices[instrumentId] = price;
    }
}
