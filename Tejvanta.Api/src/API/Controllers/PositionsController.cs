using Microsoft.AspNetCore.Mvc;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Application.UseCases;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PositionsController : ControllerBase
{
    private readonly GetPositionsHandler _getPositions;
    private readonly IPaperTradingService _tradingService;
    private readonly InstrumentRepository _instrumentRepo;

    public PositionsController(
        GetPositionsHandler getPositions,
        IPaperTradingService tradingService,
        InstrumentRepository instrumentRepo)
    {
        _getPositions = getPositions;
        _tradingService = tradingService;
        _instrumentRepo = instrumentRepo;
    }

    [HttpGet]
    public async Task<ActionResult<List<PositionDto>>> GetPositions()
    {
        var positions = await _getPositions.HandleAsync(1);
        return Ok(positions);
    }

    public record SymbolRequest(string Symbol);

    [HttpPost("close")]
    public async Task<ActionResult> ClosePosition([FromBody] SymbolRequest request)
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(request.Symbol);
        if (instrument == null) return NotFound($"Instrument {request.Symbol} not found");

        var result = await _tradingService.ClosePositionAsync(1, instrument.Id);
        if (!result) return NotFound("No open position found");
        return Ok();
    }

    [HttpPost("reverse")]
    public async Task<ActionResult> ReversePosition([FromBody] SymbolRequest request)
    {
        var instrument = await _instrumentRepo.GetBySymbolAsync(request.Symbol);
        if (instrument == null) return NotFound($"Instrument {request.Symbol} not found");

        var result = await _tradingService.ReversePositionAsync(1, instrument.Id);
        if (!result) return NotFound("No open position found");
        return Ok();
    }
}
