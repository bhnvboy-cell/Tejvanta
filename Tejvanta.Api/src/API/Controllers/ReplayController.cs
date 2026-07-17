using Microsoft.AspNetCore.Mvc;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Application.UseCases;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReplayController : ControllerBase
{
    private readonly StartReplayHandler _startReplay;
    private readonly StopReplayHandler _stopReplay;
    private readonly IReplayService _replayService;

    public ReplayController(
        StartReplayHandler startReplay,
        StopReplayHandler stopReplay,
        IReplayService replayService)
    {
        _startReplay = startReplay;
        _stopReplay = stopReplay;
        _replayService = replayService;
    }

    [HttpPost("start")]
    public async Task<ActionResult<ReplayStateDto>> StartReplay([FromBody] StartReplayRequest request)
    {
        var state = await _startReplay.HandleAsync(request);
        return Ok(state);
    }

    [HttpPost("stop")]
    public async Task<ActionResult> StopReplay([FromBody] StopReplayRequest request)
    {
        await _stopReplay.HandleAsync(request.InstrumentId);
        return Ok();
    }

    [HttpPost("pause")]
    public async Task<ActionResult> PauseReplay([FromBody] PauseReplayRequest request)
    {
        await _replayService.PauseReplayAsync(request.InstrumentId);
        return Ok();
    }

    [HttpPost("resume")]
    public async Task<ActionResult> ResumeReplay([FromBody] ResumeReplayRequest request)
    {
        await _replayService.ResumeReplayAsync(request.InstrumentId);
        return Ok();
    }

    [HttpGet("state")]
    public ActionResult<ReplayStateDto> GetState([FromQuery] int instrumentId)
    {
        var state = _replayService.GetReplayState(instrumentId);
        return Ok(new ReplayStateDto(
            state.InstrumentId, state.IsPlaying, state.CurrentTime,
            state.From, state.To, state.Speed, state.TickCount, state.ProgressPercent
        ));
    }
}
