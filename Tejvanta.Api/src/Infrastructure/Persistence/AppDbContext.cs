using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Instrument> Instruments => Set<Instrument>();
    public DbSet<Candle> Candles => Set<Candle>();
    public DbSet<Tick> Ticks => Set<Tick>();
    public DbSet<PaperOrder> PaperOrders => Set<PaperOrder>();
    public DbSet<PaperTrade> PaperTrades => Set<PaperTrade>();
    public DbSet<PaperPosition> PaperPositions => Set<PaperPosition>();
    public DbSet<OptionsContract> OptionsContracts => Set<OptionsContract>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<Layout> Layouts => Set<Layout>();
    public DbSet<Watchlist> Watchlists => Set<Watchlist>();
    public DbSet<WatchlistItem> WatchlistItems => Set<WatchlistItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Instrument>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Symbol);
            e.Property(x => x.Symbol).HasMaxLength(50);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Exchange).HasMaxLength(20);
        });

        modelBuilder.Entity<Candle>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.InstrumentId, x.Timestamp, x.Timeframe });
            e.HasOne(x => x.Instrument).WithMany().HasForeignKey(x => x.InstrumentId);
        });

        modelBuilder.Entity<Tick>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.InstrumentId, x.Timestamp });
        });

        modelBuilder.Entity<PaperOrder>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.Status });
            e.HasOne(x => x.Instrument).WithMany().HasForeignKey(x => x.InstrumentId);
        });

        modelBuilder.Entity<PaperTrade>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId);
        });

        modelBuilder.Entity<PaperPosition>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.InstrumentId }).IsUnique();
            e.HasOne(x => x.Instrument).WithMany().HasForeignKey(x => x.InstrumentId);
        });

        modelBuilder.Entity<OptionsContract>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UnderlyingInstrumentId, x.Expiry, x.Strike, x.OptionType });
            e.HasOne(x => x.Underlying).WithMany().HasForeignKey(x => x.UnderlyingInstrumentId);
        });

        modelBuilder.Entity<UserSettings>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId).IsUnique();
        });

        modelBuilder.Entity<Layout>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
        });

        modelBuilder.Entity<Watchlist>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.WatchlistId);
        });

        modelBuilder.Entity<WatchlistItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Instrument).WithMany().HasForeignKey(x => x.InstrumentId);
        });
    }
}
