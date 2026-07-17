using Microsoft.AspNetCore.SignalR;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.API.WebSockets;

public class TradingBroadcaster : IDisposable
{
    private readonly IHubContext<TradingHub> _hubContext;
    private readonly IPaperTradingService _tradingService;
    private readonly ILogger<TradingBroadcaster> _logger;

    public TradingBroadcaster(IHubContext<TradingHub> hubContext, IPaperTradingService tradingService, ILogger<TradingBroadcaster> logger)
    {
        _hubContext = hubContext;
        _tradingService = tradingService;
        _logger = logger;

        _tradingService.OnOrderUpdated += OnOrderUpdated;
        _tradingService.OnPositionUpdated += OnPositionUpdated;

        _logger.LogInformation("TradingBroadcaster initialized");
    }

    private async void OnOrderUpdated(PaperOrder order)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("OrderUpdated", new
            {
                order.Id, order.InstrumentId, Symbol = order.Instrument?.Symbol ?? "",
                order.Side, order.OrderType, order.Price, order.Quantity,
                order.StopLoss, order.TakeProfit, order.Status,
                order.FilledQuantity, order.AvgFillPrice, order.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting order update");
        }
    }

    private async void OnPositionUpdated(PaperPosition position)
    {
        try
        {
            var pnlPercent = position.AvgPrice != 0
                ? ((position.CurrentPrice - position.AvgPrice) / position.AvgPrice) * 100 * (position.Quantity > 0 ? 1 : -1)
                : 0;

            await _hubContext.Clients.All.SendAsync("PositionUpdated", new
            {
                position.Id, position.InstrumentId, Symbol = position.Instrument?.Symbol ?? "",
                position.Quantity, position.AvgPrice, position.CurrentPrice,
                position.UnrealizedPnL, position.RealizedPnL,
                PnLPercent = Math.Round(pnlPercent, 2),
                TotalPnL = position.UnrealizedPnL + position.RealizedPnL
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting position update");
        }
    }

    public void Dispose()
    {
        _tradingService.OnOrderUpdated -= OnOrderUpdated;
        _tradingService.OnPositionUpdated -= OnPositionUpdated;
    }
}
