using Microsoft.AspNetCore.SignalR;

namespace Tejvanta.Api.API.WebSockets;

public class ReplayHub : Hub
{
    private readonly ILogger<ReplayHub> _logger;

    public ReplayHub(ILogger<ReplayHub> logger)
    {
        _logger = logger;
    }

    public async Task SubscribeReplay(int instrumentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"replay_{instrumentId}");
        _logger.LogInformation("Client {Id} subscribed to replay for instrument {Instrument}",
            Context.ConnectionId, instrumentId);
    }

    public async Task UnsubscribeReplay(int instrumentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"replay_{instrumentId}");
    }
}
