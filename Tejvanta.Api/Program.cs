using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Tejvanta.Api.API.WebSockets;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.MarketData;
using Tejvanta.Api.Infrastructure.Options;
using Tejvanta.Api.Infrastructure.PaperTrading;
using Tejvanta.Api.Infrastructure.Persistence;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;
using Tejvanta.Api.Infrastructure.Replay;
using Tejvanta.Api.Application.UseCases;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/tejvanta-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

var config = builder.Configuration;
var pgConfig = new PostgreSqlConfig();
config.GetSection("PostgreSql").Bind(pgConfig);

if (pgConfig.UsePostgreSql)
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(pgConfig.ConnectionString));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite("Data Source=tejvanta.db"));
}

builder.Services.AddScoped<InstrumentRepository>();
builder.Services.AddScoped<OrderRepository>();
builder.Services.AddScoped<PositionRepository>();
builder.Services.AddScoped<OptionsRepository>();

builder.Services.AddSingleton<MarketDataFeed>();
builder.Services.AddSingleton<IMarketDataService>(sp => sp.GetRequiredService<MarketDataFeed>());
builder.Services.AddSingleton<IPaperTradingService, PaperTradingService>();
builder.Services.AddSingleton<IOptionsService, OptionsService>();
builder.Services.AddSingleton<IReplayService, ReplayService>();
builder.Services.AddSingleton<IReplayPriceProvider, ReplayPriceProvider>();
builder.Services.AddSingleton<MarketDataBroadcaster>();
builder.Services.AddSingleton<OptionsBroadcaster>();
builder.Services.AddSingleton<ReplayBroadcaster>();
builder.Services.AddSingleton<TradingBroadcaster>();


builder.Services.AddScoped<PlaceOrderHandler>();
builder.Services.AddScoped<CancelOrderHandler>();
builder.Services.AddScoped<GetOrdersHandler>();
builder.Services.AddScoped<GetPositionsHandler>();
builder.Services.AddScoped<GetOptionsChainHandler>();
builder.Services.AddScoped<GetExpiriesHandler>();
builder.Services.AddScoped<StartReplayHandler>();
builder.Services.AddScoped<StopReplayHandler>();

builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
}

app.UseSerilogRequestLogging();

using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    ctx.Database.EnsureCreated();
    var instrumentRepo = scope.ServiceProvider.GetRequiredService<InstrumentRepository>();
    await instrumentRepo.SeedInstrumentsAsync();
}

var marketDataFeed = app.Services.GetRequiredService<IMarketDataService>() as MarketDataFeed;
var broadcaster = app.Services.GetRequiredService<MarketDataBroadcaster>();

if (marketDataFeed != null)
{
    await marketDataFeed.StartSimulationAsync(1000);
    await broadcaster.UpdateStatusAsync(new Tejvanta.Api.Domain.Entities.DataConnectionStatus(
        Tejvanta.Api.Domain.Entities.DataSourceType.Simulation,
        Tejvanta.Api.Domain.Entities.ConnectionState.Connected,
        "Simulated market data + NSE bhavcopy (if available)"));
    Log.Information("Market data simulation started");
}

app.Services.GetRequiredService<MarketDataBroadcaster>();
app.Services.GetRequiredService<OptionsBroadcaster>();
app.Services.GetRequiredService<ReplayBroadcaster>();
app.Services.GetRequiredService<TradingBroadcaster>();

app.UseRouting();
app.UseCors();

app.MapControllers();
app.MapHub<MarketDataHub>("/ws/market/ticks").RequireCors(c => c.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials());
app.MapHub<TradingHub>("/ws/trading").RequireCors(c => c.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials());
app.MapHub<OptionsHub>("/ws/options").RequireCors(c => c.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials());
app.MapHub<ReplayHub>("/ws/replay").RequireCors(c => c.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials());

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

Log.Information("Tejvanta API starting...");
app.Run();
