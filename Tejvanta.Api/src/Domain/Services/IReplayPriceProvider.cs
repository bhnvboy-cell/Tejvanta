namespace Tejvanta.Api.Domain.Services;

public interface IReplayPriceProvider
{
    decimal? GetCurrentPrice(int instrumentId);
    void UpdatePrice(int instrumentId, decimal price);
}
