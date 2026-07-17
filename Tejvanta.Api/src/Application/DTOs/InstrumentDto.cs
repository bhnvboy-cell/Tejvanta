namespace Tejvanta.Api.Application.DTOs;

public record InstrumentDto(
    int Id,
    string Symbol,
    string Name,
    string Exchange,
    decimal TickSize,
    int LotSize,
    string Segment,
    string Series
);

public record CandleDto(
    long Id,
    int InstrumentId,
    DateTime Timestamp,
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    long Volume,
    string Timeframe
);

public record TickDto(
    int InstrumentId,
    DateTime Timestamp,
    decimal Price,
    long Volume,
    decimal Bid,
    decimal Ask,
    decimal Open,
    decimal High,
    decimal Low,
    decimal PrevClose,
    decimal Change,
    decimal ChangePercent
);
