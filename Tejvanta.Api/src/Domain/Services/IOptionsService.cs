using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Domain.Services;

public interface IOptionsService
{
    Task<List<OptionsContract>> GetOptionsChainAsync(int underlyingInstrumentId, DateTime expiry);
    Task<List<DateTime>> GetAvailableExpiriesAsync(int underlyingInstrumentId);
    event Action<List<OptionsContract>>? OnChainUpdated;
}
