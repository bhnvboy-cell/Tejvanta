using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.Application.UseCases;

public class PlaceOrderHandler
{
    private readonly IPaperTradingService _tradingService;
    private readonly IReplayPriceProvider _replayPrice;

    public PlaceOrderHandler(IPaperTradingService tradingService, IReplayPriceProvider replayPrice)
    {
        _tradingService = tradingService;
        _replayPrice = replayPrice;
    }

    public async Task<OrderDto> HandleAsync(PlaceOrderRequest request)
    {
        if (request.Mode == "REPLAY")
        {
            var replayPrice = _replayPrice.GetCurrentPrice(request.InstrumentId);
            if (replayPrice == null)
                throw new InvalidOperationException("No replay price available for this instrument");

            var order = new PaperOrder
            {
                InstrumentId = request.InstrumentId,
                Side = request.Side.ToUpper(),
                OrderType = "MARKET",
                Price = replayPrice.Value,
                Quantity = request.Quantity,
                Status = "FILLED",
                FilledQuantity = request.Quantity,
                AvgFillPrice = replayPrice.Value,
                CreatedAt = DateTime.UtcNow,
            };

            var result = await _tradingService.PlaceOrderAsync(order);

            return new OrderDto(
                result.Id, result.InstrumentId, result.Instrument?.Symbol ?? "",
                result.Side, result.OrderType, result.Price, result.Quantity,
                result.StopLoss, result.TakeProfit, result.Status,
                result.FilledQuantity, result.AvgFillPrice, result.CreatedAt,
                result.BasketId, "REPLAY"
            );
        }

        var liveOrder = new PaperOrder
        {
            InstrumentId = request.InstrumentId,
            Side = request.Side.ToUpper(),
            OrderType = request.OrderType.ToUpper(),
            Price = request.Price,
            Quantity = request.Quantity,
            StopLoss = request.StopLoss,
            TakeProfit = request.TakeProfit,
            BasketId = request.BasketId,
        };

        var liveResult = await _tradingService.PlaceOrderAsync(liveOrder);

        return new OrderDto(
            liveResult.Id, liveResult.InstrumentId, liveResult.Instrument?.Symbol ?? "",
            liveResult.Side, liveResult.OrderType, liveResult.Price, liveResult.Quantity,
            liveResult.StopLoss, liveResult.TakeProfit, liveResult.Status,
            liveResult.FilledQuantity, liveResult.AvgFillPrice, liveResult.CreatedAt,
            liveResult.BasketId
        );
    }
}

public class CancelOrderHandler
{
    private readonly IPaperTradingService _tradingService;

    public CancelOrderHandler(IPaperTradingService tradingService) => _tradingService = tradingService;

    public async Task<bool> HandleAsync(CancelOrderRequest request) =>
        await _tradingService.CancelOrderAsync(request.OrderId);
}

public class GetOrdersHandler
{
    private readonly IPaperTradingService _tradingService;

    public GetOrdersHandler(IPaperTradingService tradingService) => _tradingService = tradingService;

    public async Task<List<OrderDto>> HandleAsync(int userId, bool openOnly = false)
    {
        var orders = openOnly
            ? await _tradingService.GetOpenOrdersAsync(userId)
            : await _tradingService.GetAllOrdersAsync(userId);

        return orders.Select(o => new OrderDto(
            o.Id, o.InstrumentId, o.Instrument?.Symbol ?? "",
            o.Side, o.OrderType, o.Price, o.Quantity,
            o.StopLoss, o.TakeProfit, o.Status,
            o.FilledQuantity, o.AvgFillPrice, o.CreatedAt, o.BasketId
        )).ToList();
    }
}

public class GetPositionsHandler
{
    private readonly IPaperTradingService _tradingService;

    public GetPositionsHandler(IPaperTradingService tradingService) => _tradingService = tradingService;

    public async Task<List<PositionDto>> HandleAsync(int userId)
    {
        var positions = await _tradingService.GetPositionsAsync(userId);
        return positions.Select(p =>
        {
            var pnlPercent = p.AvgPrice != 0
                ? ((p.CurrentPrice - p.AvgPrice) / p.AvgPrice) * 100 * (p.Quantity > 0 ? 1 : -1)
                : 0;
            return new PositionDto(
                p.Id, p.InstrumentId, p.Instrument?.Symbol ?? "",
                p.Quantity, p.AvgPrice, p.CurrentPrice,
                p.UnrealizedPnL, p.RealizedPnL,
                Math.Round(pnlPercent, 2),
                p.UnrealizedPnL + p.RealizedPnL
            );
        }).ToList();
    }
}
