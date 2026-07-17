using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.Application.UseCases;

public class GetOptionsChainHandler
{
    private readonly IOptionsService _optionsService;

    public GetOptionsChainHandler(IOptionsService optionsService) => _optionsService = optionsService;

    public async Task<OptionsChainResponse> HandleAsync(int underlyingInstrumentId, string symbol, DateTime expiry)
    {
        var contracts = await _optionsService.GetOptionsChainAsync(underlyingInstrumentId, expiry);

        return new OptionsChainResponse(symbol, expiry,
            contracts.Select(c => new OptionsContractDto(
                c.Id, c.UnderlyingInstrumentId, c.Strike, c.Expiry,
                c.OptionType, c.LTP, c.Bid, c.Ask, c.OpenInterest,
                c.Volume, c.IV, c.Change, c.ChangePercent
            )).ToList()
        );
    }
}

public class GetExpiriesHandler
{
    private readonly IOptionsService _optionsService;

    public GetExpiriesHandler(IOptionsService optionsService) => _optionsService = optionsService;

    public async Task<List<DateTime>> HandleAsync(int underlyingInstrumentId) =>
        await _optionsService.GetAvailableExpiriesAsync(underlyingInstrumentId);
}
