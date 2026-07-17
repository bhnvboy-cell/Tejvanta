using Microsoft.AspNetCore.Mvc;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstrumentsController : ControllerBase
{
    private readonly InstrumentRepository _repo;

    public InstrumentsController(InstrumentRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<List<InstrumentDto>>> GetAll()
    {
        var instruments = await _repo.GetAllAsync();
        return Ok(instruments.Select(i => new InstrumentDto(
            i.Id, i.Symbol, i.Name, i.Exchange,
            i.TickSize, i.LotSize, i.Segment, i.Series
        )));
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<InstrumentDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(new List<InstrumentDto>());
        var instruments = await _repo.SearchAsync(q);
        return Ok(instruments.Select(i => new InstrumentDto(
            i.Id, i.Symbol, i.Name, i.Exchange,
            i.TickSize, i.LotSize, i.Segment, i.Series
        )));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InstrumentDto>> GetById(int id)
    {
        var instrument = await _repo.GetByIdAsync(id);
        if (instrument == null) return NotFound();
        return Ok(new InstrumentDto(
            instrument.Id, instrument.Symbol, instrument.Name, instrument.Exchange,
            instrument.TickSize, instrument.LotSize, instrument.Segment, instrument.Series
        ));
    }
}
