using Microsoft.AspNetCore.SignalR;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;

namespace Tejvanta.Api.API.WebSockets;

public class MarketDataHub : Hub
{
    private readonly IMarketDataService _marketData;
    private readonly InstrumentRepository _instrumentRepo;
    private readonly ILogger<MarketDataHub> _logger;

    public MarketDataHub(
        IMarketDataService marketData,
        InstrumentRepository instrumentRepo,
        ILogger<MarketDataHub> logger)
    {
        _marketData = marketData;
        _instrumentRepo = instrumentRepo;
        _logger = logger;
    }

    public async Task SubscribeSymbol(string symbol)
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(symbol);
        if (instrument == null)
        {
            await Clients.Caller.SendAsync("Error", $"Symbol {symbol} not found");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"symbol_{instrument.Id}");
        _logger.LogInformation("Client {Id} subscribed to {Symbol}", Context.ConnectionId, symbol);

        var latestTick = await _marketData.GetLatestTickAsync(instrument.Id);
        if (latestTick != null)
            await Clients.Caller.SendAsync("Tick", latestTick);
    }

    public async Task UnsubscribeSymbol(string symbol)
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(symbol);
        if (instrument != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"symbol_{instrument.Id}");
            _logger.LogInformation("Client {Id} unsubscribed from {Symbol}", Context.ConnectionId, symbol);
        }
    }

    public async Task SubscribeSymbols(List<string> symbols)
    {
        foreach (var symbol in symbols)
        {
            var instrument = await _instrumentRepo.GetBySymbolAsync(symbol);
            if (instrument != null)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"symbol_{instrument.Id}");
        }
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {Id}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {Id}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
