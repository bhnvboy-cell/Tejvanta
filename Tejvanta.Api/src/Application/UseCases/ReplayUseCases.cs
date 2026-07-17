using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Domain.Services;

namespace Tejvanta.Api.Application.UseCases;

public class StartReplayHandler
{
    private readonly IReplayService _replayService;

    public StartReplayHandler(IReplayService replayService) => _replayService = replayService;

    public async Task<ReplayStateDto> HandleAsync(StartReplayRequest request)
    {
        await _replayService.StartReplayAsync(request.InstrumentId, request.From, request.To, request.Speed);
        var state = _replayService.GetReplayState(request.InstrumentId);
        return MapState(state);
    }

    private static ReplayStateDto MapState(ReplayState state) => new(
        state.InstrumentId, state.IsPlaying, state.CurrentTime,
        state.From, state.To, state.Speed, state.TickCount, state.ProgressPercent
    );
}

public class StopReplayHandler
{
    private readonly IReplayService _replayService;

    public StopReplayHandler(IReplayService replayService) => _replayService = replayService;

    public async Task HandleAsync(int instrumentId) =>
        await _replayService.StopReplayAsync(instrumentId);
}
