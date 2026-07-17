using Microsoft.AspNetCore.Mvc;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Application.UseCases;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OptionsController : ControllerBase
{
    private readonly GetOptionsChainHandler _getChain;
    private readonly GetExpiriesHandler _getExpiries;
    private readonly InstrumentRepository _instrumentRepo;

    public OptionsController(
        GetOptionsChainHandler getChain,
        GetExpiriesHandler getExpiries,
        InstrumentRepository instrumentRepo)
    {
        _getChain = getChain;
        _getExpiries = getExpiries;
        _instrumentRepo = instrumentRepo;
    }

    [HttpGet("chain")]
    public async Task<ActionResult<OptionsChainResponse>> GetChain(
        [FromQuery] string symbol,
        [FromQuery] DateTime? expiry)
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(symbol);
        if (instrument == null) return NotFound($"Instrument {symbol} not found");

        var expiries = await _getExpiries.HandleAsync(instrument.Id);
        var selectedExpiry = expiry ?? expiries.FirstOrDefault();
        if (selectedExpiry == default)
            return NotFound("No expiries available");

        var chain = await _getChain.HandleAsync(instrument.Id, symbol, selectedExpiry);
        return Ok(chain);
    }

    [HttpGet("expiries")]
    public async Task<ActionResult<List<DateTime>>> GetExpiries([FromQuery] string symbol)
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(symbol);
        if (instrument == null) return NotFound($"Instrument {symbol} not found");

        var expiries = await _getExpiries.HandleAsync(instrument.Id);
        return Ok(expiries);
    }
}
