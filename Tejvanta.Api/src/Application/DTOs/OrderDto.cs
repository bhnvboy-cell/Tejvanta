using System.ComponentModel.DataAnnotations;

namespace Tejvanta.Api.Application.DTOs;

public record PlaceOrderRequest(
    [Required] int InstrumentId,
    [Required, RegularExpression("^(BUY|SELL)$")] string Side,
    [Required, RegularExpression("^(MARKET|LIMIT)$")] string OrderType,
    [Range(0, double.MaxValue)] decimal Price,
    [Range(1, 100000)] int Quantity,
    [Range(0, double.MaxValue)] decimal StopLoss,
    [Range(0, double.MaxValue)] decimal TakeProfit,
    string? BasketId,
    string Mode = "LIVE"
);

public record CancelOrderRequest([Required] int OrderId);

public record OrderDto(
    int Id,
    int InstrumentId,
    string Symbol,
    string Side,
    string OrderType,
    decimal Price,
    int Quantity,
    decimal StopLoss,
    decimal TakeProfit,
    string Status,
    int FilledQuantity,
    decimal AvgFillPrice,
    DateTime CreatedAt,
    string? BasketId,
    string Mode = "LIVE"
);

public record PositionDto(
    int Id,
    int InstrumentId,
    string Symbol,
    int Quantity,
    decimal AvgPrice,
    decimal CurrentPrice,
    decimal UnrealizedPnL,
    decimal RealizedPnL,
    decimal PnLPercent,
    decimal TotalPnL
);

public record TradeDto(
    int Id,
    int OrderId,
    int InstrumentId,
    string Symbol,
    string Side,
    decimal Price,
    int Quantity,
    DateTime TradeTime
);
