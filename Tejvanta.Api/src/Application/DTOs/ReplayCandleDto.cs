namespace Tejvanta.Api.Application.DTOs;

public class ReplayCandleDto
{
    public int InstrumentId { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
}
