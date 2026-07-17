using System.ComponentModel.DataAnnotations.Schema;

namespace Tejvanta.Api.Domain.Entities;

public class Tick
{
    public long Id { get; set; }
    public int InstrumentId { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal Price { get; set; }
    public long Volume { get; set; }
    public decimal Bid { get; set; }
    public decimal Ask { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal PrevClose { get; set; }
    [NotMapped] public decimal Change => Price - PrevClose;
    [NotMapped] public decimal ChangePercent => PrevClose != 0 ? (Change / PrevClose) * 100 : 0;
}
