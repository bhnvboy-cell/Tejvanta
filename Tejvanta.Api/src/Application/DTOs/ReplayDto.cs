namespace Tejvanta.Api.Application.DTOs;

public record StartReplayRequest(
    int InstrumentId,
    DateTime From,
    DateTime To,
    double Speed
);

public record StopReplayRequest(int InstrumentId);

public record PauseReplayRequest(int InstrumentId);

public record ResumeReplayRequest(int InstrumentId);

public record ReplayStateDto(
    int InstrumentId,
    bool IsPlaying,
    DateTime CurrentTime,
    DateTime From,
    DateTime To,
    double Speed,
    int TickCount,
    double ProgressPercent
);
