using Microsoft.AspNetCore.Mvc;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.MarketData;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketController : ControllerBase
{
    private readonly IMarketDataService _marketData;
    private readonly InstrumentRepository _instrumentRepo;
    private readonly MarketDataBroadcaster _broadcaster;
    private readonly ILogger<MarketController> _logger;

    public MarketController(
        IMarketDataService marketData,
        InstrumentRepository instrumentRepo,
        MarketDataBroadcaster broadcaster,
        ILogger<MarketController> logger)
    {
        _marketData = marketData;
        _instrumentRepo = instrumentRepo;
        _broadcaster = broadcaster;
        _logger = logger;
    }

    [HttpGet("data-status")]
    public ActionResult<DataConnectionStatus> GetDataStatus()
    {
        return Ok(_broadcaster.GetCurrentStatus());
    }

    [HttpGet("ohlc")]
    public async Task<ActionResult<List<CandleDto>>> GetOhlc(
        [FromQuery] string symbol,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string timeframe = "1D")
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(symbol);
        if (instrument == null) return NotFound($"Instrument {symbol} not found");

        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;
        var dbCandles = await _marketData.GetOhlcAsync(instrument.Id, fromDate, toDate, timeframe);
        return Ok(dbCandles.Select(c => new CandleDto(
            c.Id, c.InstrumentId, c.Timestamp, c.Open, c.High, c.Low, c.Close, c.Volume, c.Timeframe
        )));
    }

    [HttpGet("ticks/latest")]
    public async Task<ActionResult<TickDto>> GetLatestTick([FromQuery] string symbol)
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(symbol);
        if (instrument == null) return NotFound();

        var tick = await _marketData.GetLatestTickAsync(instrument.Id);
        if (tick == null) return NotFound("No tick data available");

        return Ok(new TickDto(
            tick.InstrumentId, tick.Timestamp, tick.Price, tick.Volume,
            tick.Bid, tick.Ask, tick.Open, tick.High, tick.Low,
            tick.PrevClose, tick.Change, tick.ChangePercent
        ));
    }
}
