using Microsoft.AspNetCore.SignalR;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Application.UseCases;

namespace Tejvanta.Api.API.WebSockets;

public class TradingHub : Hub
{
    private readonly IPaperTradingService _tradingService;
    private readonly IReplayPriceProvider _replayPrice;
    private readonly ILogger<TradingHub> _logger;

    public TradingHub(IPaperTradingService tradingService, IReplayPriceProvider replayPrice, ILogger<TradingHub> logger)
    {
        _tradingService = tradingService;
        _replayPrice = replayPrice;
        _logger = logger;
    }

    public override Task OnConnectedAsync()
    {
        _logger.LogInformation("Trading client connected: {Id}", Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Trading client disconnected: {Id}", Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }

    public async Task PlaceOrder(PlaceOrderRequest request)
    {
        try
        {
            var handler = new PlaceOrderHandler(_tradingService, _replayPrice);
            var order = await handler.HandleAsync(request);
            await Clients.Caller.SendAsync("OrderPlaced", order);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    public async Task CancelOrder(int orderId)
    {
        var result = await _tradingService.CancelOrderAsync(orderId);
        await Clients.Caller.SendAsync("OrderCancelled", new { OrderId = orderId, Success = result });
    }
}
