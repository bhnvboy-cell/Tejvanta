namespace Tejvanta.Api.Domain.Entities;

public class PaperOrder
{
    public int Id { get; set; }
    public int UserId { get; set; } = 1;
    public int InstrumentId { get; set; }
    public string Side { get; set; } = "BUY";
    public string OrderType { get; set; } = "MARKET";
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal StopLoss { get; set; }
    public decimal TakeProfit { get; set; }
    public string Status { get; set; } = "PENDING";
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int FilledQuantity { get; set; }
    public decimal AvgFillPrice { get; set; }
    public string? BasketId { get; set; }
    public Instrument? Instrument { get; set; }
}
