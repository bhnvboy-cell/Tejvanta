namespace Tejvanta.Api.Application.DTOs;

public record OptionsContractDto(
    int Id,
    int UnderlyingInstrumentId,
    decimal Strike,
    DateTime Expiry,
    string OptionType,
    decimal LTP,
    decimal Bid,
    decimal Ask,
    decimal OpenInterest,
    long Volume,
    decimal IV,
    decimal Change,
    decimal ChangePercent
);

public record OptionsChainResponse(
    string Symbol,
    DateTime Expiry,
    List<OptionsContractDto> Contracts
);
