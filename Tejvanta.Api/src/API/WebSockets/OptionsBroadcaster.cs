using Microsoft.AspNetCore.SignalR;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.API.WebSockets;

public class OptionsBroadcaster : IDisposable
{
    private readonly IHubContext<OptionsHub> _hubContext;
    private readonly IOptionsService _optionsService;
    private readonly ILogger<OptionsBroadcaster> _logger;

    public OptionsBroadcaster(IHubContext<OptionsHub> hubContext, IOptionsService optionsService, ILogger<OptionsBroadcaster> logger)
    {
        _hubContext = hubContext;
        _optionsService = optionsService;
        _logger = logger;

        _optionsService.OnChainUpdated += OnChainUpdated;

        _logger.LogInformation("OptionsBroadcaster initialized");
    }

    private async void OnChainUpdated(List<OptionsContract> contracts)
    {
        try
        {
            var data = contracts.Select(c => new
            {
                c.Id, c.UnderlyingInstrumentId, c.Strike, c.Expiry,
                c.OptionType, c.LTP, c.Bid, c.Ask, c.OpenInterest,
                c.Volume, c.IV, c.Change, c.ChangePercent
            });

            await _hubContext.Clients.All.SendAsync("OptionsChainUpdated", data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting options chain update");
        }
    }

    public void Dispose()
    {
        _optionsService.OnChainUpdated -= OnChainUpdated;
    }
}
