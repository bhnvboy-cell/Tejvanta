namespace Tejvanta.Api.Domain.Entities;

public class PaperTrade
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int InstrumentId { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string Side { get; set; } = "BUY";
    public DateTime TradeTime { get; set; } = DateTime.UtcNow;
    public PaperOrder? Order { get; set; }
}
