using Microsoft.AspNetCore.SignalR;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.API.WebSockets;

public class ReplayBroadcaster : IDisposable
{
    private readonly IHubContext<ReplayHub> _hubContext;
    private readonly IReplayService _replayService;
    private readonly IReplayPriceProvider _replayPrice;
    private readonly ILogger<ReplayBroadcaster> _logger;

    public ReplayBroadcaster(IHubContext<ReplayHub> hubContext, IReplayService replayService, IReplayPriceProvider replayPrice, ILogger<ReplayBroadcaster> logger)
    {
        _hubContext = hubContext;
        _replayService = replayService;
        _replayPrice = replayPrice;
        _logger = logger;

        _replayService.OnReplayTick += OnReplayTick;
        _replayService.OnReplayStateChanged += OnReplayStateChanged;
        _replayService.OnReplayCandleCompleted += OnReplayCandleCompleted;

        _logger.LogInformation("ReplayBroadcaster initialized");
    }

    private async void OnReplayTick(Tick tick)
    {
        try
        {
            _replayPrice.UpdatePrice(tick.InstrumentId, tick.Price);
            await _hubContext.Clients.Group($"replay_{tick.InstrumentId}").SendAsync("ReplayTick", tick);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting replay tick");
        }
    }

    private async void OnReplayStateChanged(ReplayState state)
    {
        try
        {
            await _hubContext.Clients.Group($"replay_{state.InstrumentId}").SendAsync("ReplayState", state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting replay state");
        }
    }

    private async void OnReplayCandleCompleted(ReplayCandle candle)
    {
        try
        {
            await _hubContext.Clients.Group($"replay_{candle.InstrumentId}").SendAsync("ReplayCandleCompleted", candle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting replay candle");
        }
    }

    public void Dispose()
    {
        _replayService.OnReplayTick -= OnReplayTick;
        _replayService.OnReplayStateChanged -= OnReplayStateChanged;
        _replayService.OnReplayCandleCompleted -= OnReplayCandleCompleted;
    }
}
