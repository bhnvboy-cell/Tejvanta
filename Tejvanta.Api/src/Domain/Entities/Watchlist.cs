namespace Tejvanta.Api.Domain.Entities;

public class Watchlist
{
    public int Id { get; set; }
    public int UserId { get; set; } = 1;
    public string Name { get; set; } = "Default";
    public List<WatchlistItem> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WatchlistItem
{
    public int Id { get; set; }
    public int WatchlistId { get; set; }
    public int InstrumentId { get; set; }
    public int SortOrder { get; set; }
    public Instrument? Instrument { get; set; }
}
