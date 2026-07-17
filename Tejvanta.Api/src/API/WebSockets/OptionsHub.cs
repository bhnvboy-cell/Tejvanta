using Microsoft.AspNetCore.SignalR;

namespace Tejvanta.Api.API.WebSockets;

public class OptionsHub : Hub
{
    private readonly ILogger<OptionsHub> _logger;

    public OptionsHub(ILogger<OptionsHub> logger)
    {
        _logger = logger;
    }

    public override Task OnConnectedAsync()
    {
        _logger.LogInformation("Options client connected: {Id}", Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Options client disconnected: {Id}", Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeChain(int underlyingInstrumentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"options_{underlyingInstrumentId}");
        _logger.LogInformation("Client {Id} subscribed to options chain for {Underlying}",
            Context.ConnectionId, underlyingInstrumentId);
    }

    public async Task UnsubscribeChain(int underlyingInstrumentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"options_{underlyingInstrumentId}");
    }
}
