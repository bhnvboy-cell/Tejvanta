using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Domain.Services;

public class ReplayCandle
{
    public int InstrumentId { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
}

public interface IReplayService
{
    Task StartReplayAsync(int instrumentId, DateTime from, DateTime to, double speed = 1.0);
    Task StopReplayAsync(int instrumentId);
    Task PauseReplayAsync(int instrumentId);
    Task ResumeReplayAsync(int instrumentId);
    bool IsReplaying(int instrumentId);
    ReplayState GetReplayState(int instrumentId);
    event Action<Tick>? OnReplayTick;
    event Action<ReplayState>? OnReplayStateChanged;
    event Action<ReplayCandle>? OnReplayCandleCompleted;
}

public class ReplayState
{
    public int InstrumentId { get; set; }
    public bool IsPlaying { get; set; }
    public DateTime CurrentTime { get; set; }
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public double Speed { get; set; }
    public int TickCount { get; set; }
    public double ProgressPercent { get; set; }
}
