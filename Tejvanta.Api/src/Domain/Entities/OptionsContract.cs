namespace Tejvanta.Api.Domain.Entities;

public class OptionsContract
{
    public int Id { get; set; }
    public int UnderlyingInstrumentId { get; set; }
    public decimal Strike { get; set; }
    public DateTime Expiry { get; set; }
    public string OptionType { get; set; } = "CE";
    public decimal LTP { get; set; }
    public decimal OpenInterest { get; set; }
    public long Volume { get; set; }
    public decimal IV { get; set; }
    public decimal Bid { get; set; }
    public decimal Ask { get; set; }
    public decimal Change { get; set; }
    public decimal ChangePercent { get; set; }
    public Instrument? Underlying { get; set; }
}
