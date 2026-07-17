namespace Tejvanta.Api.Domain.Entities;

public class Instrument
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Exchange { get; set; } = "NSE";
    public decimal TickSize { get; set; } = 0.05m;
    public int LotSize { get; set; } = 1;
    public string Segment { get; set; } = "EQ";
    public string Series { get; set; } = "EQ";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
