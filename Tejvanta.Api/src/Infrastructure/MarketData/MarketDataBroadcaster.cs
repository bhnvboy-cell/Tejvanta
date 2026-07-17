using Microsoft.AspNetCore.SignalR;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.API.WebSockets;

namespace Tejvanta.Api.Infrastructure.MarketData;

public class MarketDataBroadcaster : IDisposable
{
    private readonly IHubContext<MarketDataHub> _hubContext;
    private readonly IMarketDataService _marketData;
    private readonly ILogger<MarketDataBroadcaster> _logger;
    private DataConnectionStatus _currentStatus = new(DataSourceType.Simulation, ConnectionState.Connected);
    private bool _disposed;

    public MarketDataBroadcaster(IHubContext<MarketDataHub> hubContext, IMarketDataService marketData, ILogger<MarketDataBroadcaster> logger)
    {
        _hubContext = hubContext;
        _marketData = marketData;
        _logger = logger;

        _marketData.OnTickReceived += OnTick;
    }

    public async Task UpdateStatusAsync(DataConnectionStatus status)
    {
        _currentStatus = status;
        try
        {
            await _hubContext.Clients.All.SendAsync("DataConnectionStatus", status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting data connection status");
        }
    }

    public DataConnectionStatus GetCurrentStatus() => _currentStatus;

    private async void OnTick(Tick tick)
    {
        try
        {
            await _hubContext.Clients.Group($"symbol_{tick.InstrumentId}").SendAsync("Tick", tick);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting tick for instrument {Id}", tick.InstrumentId);
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _marketData.OnTickReceived -= OnTick;
    }
}
