namespace Tejvanta.Api.Domain.Entities;

public class PaperPosition
{
    public int Id { get; set; }
    public int UserId { get; set; } = 1;
    public int InstrumentId { get; set; }
    public int Quantity { get; set; }
    public decimal AvgPrice { get; set; }
    public decimal RealizedPnL { get; set; }
    public decimal UnrealizedPnL { get; set; }
    public decimal CurrentPrice { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Instrument? Instrument { get; set; }
}
