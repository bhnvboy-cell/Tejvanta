using System.Collections.Concurrent;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;

namespace Tejvanta.Api.Infrastructure.Options;

public class OptionsService : IOptionsService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OptionsService> _logger;
    private Timer? _refreshTimer;
    private int _currentUnderlyingId;
    private readonly ConcurrentDictionary<int, decimal> _originalPrices = new();
    private bool _disposed;

    public event Action<List<OptionsContract>>? OnChainUpdated;

    public OptionsService(IServiceScopeFactory scopeFactory, ILogger<OptionsService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<List<OptionsContract>> GetOptionsChainAsync(int underlyingInstrumentId, DateTime expiry)
    {
        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<OptionsRepository>();

        _currentUnderlyingId = underlyingInstrumentId;
        var chain = await repo.GetChainAsync(underlyingInstrumentId, expiry);

        if (chain.Count == 0)
        {
            await repo.SeedOptionsAsync(underlyingInstrumentId);
            chain = await repo.GetChainAsync(underlyingInstrumentId, expiry);
        }

        foreach (var c in chain)
            _originalPrices.TryAdd(c.Id, c.LTP);

        StartAutoRefresh();
        return chain;
    }

    public async Task<List<DateTime>> GetAvailableExpiriesAsync(int underlyingInstrumentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<OptionsRepository>();

        var expiries = await repo.GetExpiriesAsync(underlyingInstrumentId);
        if (expiries.Count == 0)
        {
            await repo.SeedOptionsAsync(underlyingInstrumentId);
            expiries = await repo.GetExpiriesAsync(underlyingInstrumentId);
        }
        return expiries;
    }

    private void StartAutoRefresh()
    {
        _refreshTimer?.Dispose();
        _refreshTimer = new Timer(async _ =>
        {
            try
            {
                if (_currentUnderlyingId == 0) return;

                using var scope = _scopeFactory.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<OptionsRepository>();

                var expiry = (await repo.GetExpiriesAsync(_currentUnderlyingId)).FirstOrDefault();
                if (expiry == default) return;

                var chain = await repo.GetChainAsync(_currentUnderlyingId, expiry);
                foreach (var contract in chain)
                {
                    var changePercent = (decimal)(Random.Shared.NextDouble() * 0.02 - 0.01);
                    var prevLtp = contract.LTP;
                    contract.LTP = Math.Max(0.05m, contract.LTP + contract.LTP * changePercent);

                    _originalPrices.TryGetValue(contract.Id, out var originalPrice);
                    if (originalPrice > 0)
                    {
                        contract.Change = Math.Round(contract.LTP - originalPrice, 2);
                        contract.ChangePercent = originalPrice != 0
                            ? Math.Round((contract.LTP - originalPrice) / originalPrice * 100, 2)
                            : 0;
                    }

                    contract.Volume += Random.Shared.Next(10, 500);
                    contract.OpenInterest += Random.Shared.Next(-1000, 2000);
                    if (contract.OpenInterest < 0) contract.OpenInterest = 0;
                }

                OnChainUpdated?.Invoke(chain);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing options chain");
            }
        }, null, 2000, 2000);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _refreshTimer?.Dispose();
    }
}
