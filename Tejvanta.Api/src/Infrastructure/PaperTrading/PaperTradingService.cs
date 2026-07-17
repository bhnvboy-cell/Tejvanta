using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Domain.Entities;
using Tejvanta.Api.Domain.Services;
using Tejvanta.Api.Infrastructure.Persistence;
using Tejvanta.Api.Infrastructure.Persistence.Repositories;

namespace Tejvanta.Api.Infrastructure.PaperTrading;

public class PaperTradingService : IPaperTradingService
{
    private readonly IMarketDataService _marketData;
    private readonly ILogger<PaperTradingService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public event Action<PaperOrder>? OnOrderUpdated;
    public event Action<PaperPosition>? OnPositionUpdated;

    public PaperTradingService(
        IMarketDataService marketData,
        ILogger<PaperTradingService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _marketData = marketData;
        _logger = logger;
        _scopeFactory = scopeFactory;

        _marketData.OnTickReceived += OnTickReceived;
    }

    public async Task<PaperOrder> PlaceOrderAsync(PaperOrder order)
    {
        using var scope = _scopeFactory.CreateScope();
        var orderRepo = scope.ServiceProvider.GetRequiredService<OrderRepository>();
        var positionRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        order.Status = "PENDING";
        order.CreatedAt = DateTime.UtcNow;

        var latestTick = await _marketData.GetLatestTickAsync(order.InstrumentId);
        var currentPrice = latestTick?.Price ?? 0;

        if (order.OrderType == "MARKET")
        {
            order.Status = "FILLED";
            order.FilledQuantity = order.Quantity;
            order.AvgFillPrice = currentPrice;
            order.Price = currentPrice;

            await orderRepo.AddAsync(order);
            await ExecuteTradeAsync(order, orderRepo, positionRepo, ctx);
        }
        else if (order.OrderType == "LIMIT")
        {
            if (order.Side == "BUY" && currentPrice <= order.Price ||
                order.Side == "SELL" && currentPrice >= order.Price)
            {
                order.Status = "FILLED";
                order.FilledQuantity = order.Quantity;
                order.AvgFillPrice = order.Price;
                await orderRepo.AddAsync(order);
                await ExecuteTradeAsync(order, orderRepo, positionRepo, ctx);
            }
            else
            {
                order.Status = "OPEN";
                await orderRepo.AddAsync(order);
            }
        }

        var balance = await GetVirtualBalanceAsync(order.UserId);
        _logger.LogInformation("Order placed: {Side} {Qty} {Symbol} @ {Price}. Balance: {Balance}",
            order.Side, order.Quantity, order.InstrumentId, order.Price, balance);

        OnOrderUpdated?.Invoke(order);
        return order;
    }

    public async Task<bool> CancelOrderAsync(int orderId)
    {
        using var scope = _scopeFactory.CreateScope();
        var orderRepo = scope.ServiceProvider.GetRequiredService<OrderRepository>();

        var order = await orderRepo.GetByIdAsync(orderId);
        if (order == null || order.Status == "FILLED" || order.Status == "CANCELLED")
            return false;

        order.Status = "CANCELLED";
        await orderRepo.UpdateAsync(order);
        OnOrderUpdated?.Invoke(order);
        return true;
    }

    public async Task<List<PaperOrder>> GetOpenOrdersAsync(int userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var orderRepo = scope.ServiceProvider.GetRequiredService<OrderRepository>();
        return await orderRepo.GetOpenByUserAsync(userId);
    }

    public async Task<List<PaperOrder>> GetAllOrdersAsync(int userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var orderRepo = scope.ServiceProvider.GetRequiredService<OrderRepository>();
        return await orderRepo.GetByUserAsync(userId);
    }

    public async Task<List<PaperPosition>> GetPositionsAsync(int userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var positionRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();
        return await positionRepo.GetByUserAsync(userId);
    }

    public async Task<PaperPosition?> GetPositionAsync(int userId, int instrumentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var positionRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();
        return await positionRepo.GetByUserAndInstrumentAsync(userId, instrumentId);
    }

    public async Task<bool> ClosePositionAsync(int userId, int instrumentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var orderRepo = scope.ServiceProvider.GetRequiredService<OrderRepository>();
        var positionRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var position = await positionRepo.GetByUserAndInstrumentAsync(userId, instrumentId);
        if (position == null || position.Quantity == 0) return false;

        var latestTick = await _marketData.GetLatestTickAsync(instrumentId);
        var closePrice = latestTick?.Price ?? position.AvgPrice;

        var reverseSide = position.Quantity > 0 ? "SELL" : "BUY";
        var closeQty = Math.Abs(position.Quantity);

        var closeOrder = new PaperOrder
        {
            UserId = userId,
            InstrumentId = instrumentId,
            Side = reverseSide,
            OrderType = "MARKET",
            Quantity = closeQty,
            Price = closePrice,
            Status = "FILLED",
            FilledQuantity = closeQty,
            AvgFillPrice = closePrice,
            CreatedAt = DateTime.UtcNow,
        };

        await orderRepo.AddAsync(closeOrder);

        var pnl = position.Quantity > 0
            ? (closePrice - position.AvgPrice) * closeQty
            : (position.AvgPrice - closePrice) * closeQty;

        position.RealizedPnL += pnl;
        position.Quantity = 0;
        position.AvgPrice = 0;
        position.CurrentPrice = closePrice;
        await positionRepo.UpdateAsync(position);

        OnOrderUpdated?.Invoke(closeOrder);
        OnPositionUpdated?.Invoke(position);
        return true;
    }

    public async Task<bool> ReversePositionAsync(int userId, int instrumentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var orderRepo = scope.ServiceProvider.GetRequiredService<OrderRepository>();
        var positionRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();

        var position = await positionRepo.GetByUserAndInstrumentAsync(userId, instrumentId);
        if (position == null || position.Quantity == 0) return false;

        var latestTick = await _marketData.GetLatestTickAsync(instrumentId);
        var price = latestTick?.Price ?? position.AvgPrice;

        var reverseSide = position.Quantity > 0 ? "SELL" : "BUY";
        var currentQty = Math.Abs(position.Quantity);

        var closeOrder = new PaperOrder
        {
            UserId = userId,
            InstrumentId = instrumentId,
            Side = reverseSide,
            OrderType = "MARKET",
            Quantity = currentQty * 2,
            Price = price,
            Status = "FILLED",
            FilledQuantity = currentQty * 2,
            AvgFillPrice = price,
            CreatedAt = DateTime.UtcNow,
        };

        await orderRepo.AddAsync(closeOrder);

        var pnl = position.Quantity > 0
            ? (price - position.AvgPrice) * currentQty
            : (position.AvgPrice - price) * currentQty;

        position.RealizedPnL += pnl;
        position.Quantity = -position.Quantity;
        position.AvgPrice = price;
        position.CurrentPrice = price;
        position.UnrealizedPnL = 0;
        await positionRepo.UpdateAsync(position);

        OnOrderUpdated?.Invoke(closeOrder);
        OnPositionUpdated?.Invoke(position);
        return true;
    }

    public async Task<decimal> GetVirtualBalanceAsync(int userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var positionRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();

        var settings = await ctx.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        if (settings == null) return 1000000;

        var positions = await positionRepo.GetByUserAsync(userId);
        var usedMargin = positions.Sum(p => Math.Abs(p.Quantity) * p.AvgPrice * 0.2m);
        return settings.VirtualBalance - usedMargin;
    }

    public async Task<decimal> GetUsedMarginAsync(int userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var positionRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();
        var positions = await positionRepo.GetByUserAsync(userId);
        return positions.Sum(p => Math.Abs(p.Quantity) * p.AvgPrice * 0.2m);
    }

    private async Task ExecuteTradeAsync(
        PaperOrder order,
        OrderRepository orderRepo,
        PositionRepository positionRepo,
        AppDbContext ctx)
    {
        var position = await positionRepo.GetByUserAndInstrumentAsync(order.UserId, order.InstrumentId);

        if (position == null)
        {
            position = new PaperPosition
            {
                UserId = order.UserId,
                InstrumentId = order.InstrumentId,
                Quantity = order.Side == "BUY" ? order.Quantity : -order.Quantity,
                AvgPrice = order.AvgFillPrice,
                CurrentPrice = order.AvgFillPrice,
                RealizedPnL = 0,
                UnrealizedPnL = 0,
            };
            await positionRepo.AddAsync(position);
        }
        else
        {
            var prevQty = position.Quantity;
            var prevAvg = position.AvgPrice;
            var tradeQty = order.Side == "BUY" ? order.Quantity : -order.Quantity;
            var newQty = prevQty + tradeQty;

            if (prevQty == 0)
            {
                position.Quantity = tradeQty;
                position.AvgPrice = order.AvgFillPrice;
            }
            else if (Math.Sign(prevQty) == Math.Sign(tradeQty))
            {
                position.AvgPrice = ((prevQty * prevAvg) + (tradeQty * order.AvgFillPrice)) / newQty;
                position.Quantity = newQty;
            }
            else
            {
                var closingQty = Math.Min(Math.Abs(prevQty), Math.Abs(tradeQty));
                var pnl = prevQty > 0
                    ? (order.AvgFillPrice - prevAvg) * closingQty
                    : (prevAvg - order.AvgFillPrice) * closingQty;
                position.RealizedPnL += pnl;
                position.Quantity = newQty;
                position.AvgPrice = position.Quantity != 0 ? order.AvgFillPrice : 0;
            }

            position.CurrentPrice = order.AvgFillPrice;
            await positionRepo.UpdateAsync(position);
        }

        var trade = new PaperTrade
        {
            OrderId = order.Id,
            InstrumentId = order.InstrumentId,
            Price = order.AvgFillPrice,
            Quantity = order.Quantity,
            Side = order.Side,
            TradeTime = DateTime.UtcNow,
        };
        ctx.PaperTrades.Add(trade);
        await ctx.SaveChangesAsync();

        OnPositionUpdated?.Invoke(position);
    }

    private async void OnTickReceived(Tick tick)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var repo = scope.ServiceProvider.GetRequiredService<OrderRepository>();
            var posRepo = scope.ServiceProvider.GetRequiredService<PositionRepository>();

            var openOrders = await repo.GetOpenByUserAsync(1);
            var ordersToCheck = openOrders.Where(o => o.InstrumentId == tick.InstrumentId).ToList();

            foreach (var order in ordersToCheck)
            {
                bool triggered = false;

                if (order.OrderType == "LIMIT" &&
                    order.Side == "BUY" && tick.Price <= order.Price)
                    triggered = true;
                else if (order.OrderType == "LIMIT" &&
                    order.Side == "SELL" && tick.Price >= order.Price)
                    triggered = true;

                if (triggered)
                {
                    order.Status = "FILLED";
                    order.FilledQuantity = order.Quantity;
                    order.AvgFillPrice = order.Price;
                    await repo.UpdateAsync(order);

                    var orderForTrade = new PaperOrder
                    {
                        Id = order.Id,
                        UserId = order.UserId,
                        InstrumentId = order.InstrumentId,
                        Side = order.Side,
                        AvgFillPrice = order.Price,
                        Quantity = order.Quantity,
                    };
                    await ExecuteTradeAsync(orderForTrade, repo, posRepo, ctx);
                    OnOrderUpdated?.Invoke(order);
                }
            }

            var positions = await posRepo.GetByUserAsync(1);
            var posToUpdate = positions.Where(p => p.InstrumentId == tick.InstrumentId).ToList();

            foreach (var pos in posToUpdate)
            {
                pos.CurrentPrice = tick.Price;
                pos.UnrealizedPnL = pos.Quantity > 0
                    ? (tick.Price - pos.AvgPrice) * pos.Quantity
                    : (pos.AvgPrice - tick.Price) * Math.Abs(pos.Quantity);
                await posRepo.UpdateAsync(pos);

                var ordersForSL = openOrders.Where(o =>
                    o.InstrumentId == pos.InstrumentId && o.Status == "OPEN").ToList();

                foreach (var o in ordersForSL)
                {
                    if (o.StopLoss > 0 &&
                        ((pos.Quantity > 0 && tick.Price <= o.StopLoss) ||
                         (pos.Quantity < 0 && tick.Price >= o.StopLoss)))
                    {
                        var closeOrder = new PaperOrder
                        {
                            UserId = o.UserId,
                            InstrumentId = o.InstrumentId,
                            Side = pos.Quantity > 0 ? "SELL" : "BUY",
                            OrderType = "MARKET",
                            Quantity = Math.Abs(pos.Quantity),
                            Price = tick.Price,
                            Status = "FILLED",
                            FilledQuantity = Math.Abs(pos.Quantity),
                            AvgFillPrice = tick.Price,
                            CreatedAt = DateTime.UtcNow,
                        };

                        await repo.AddAsync(closeOrder);

                        var pnl = pos.Quantity > 0
                            ? (tick.Price - pos.AvgPrice) * Math.Abs(pos.Quantity)
                            : (pos.AvgPrice - tick.Price) * Math.Abs(pos.Quantity);

                        pos.RealizedPnL += pnl;
                        pos.Quantity = 0;
                        pos.AvgPrice = 0;
                        pos.UnrealizedPnL = 0;
                        await posRepo.UpdateAsync(pos);

                        var slTrade = new PaperTrade
                        {
                            OrderId = closeOrder.Id,
                            InstrumentId = pos.InstrumentId,
                            Price = tick.Price,
                            Quantity = Math.Abs(pos.Quantity),
                            Side = closeOrder.Side,
                            TradeTime = DateTime.UtcNow,
                        };
                        ctx.PaperTrades.Add(slTrade);
                        await ctx.SaveChangesAsync();

                        OnOrderUpdated?.Invoke(closeOrder);
                        OnPositionUpdated?.Invoke(pos);
                    }

                    if (o.TakeProfit > 0 &&
                        ((pos.Quantity > 0 && tick.Price >= o.TakeProfit) ||
                         (pos.Quantity < 0 && tick.Price <= o.TakeProfit)))
                    {
                        var tpOrder = new PaperOrder
                        {
                            UserId = o.UserId,
                            InstrumentId = o.InstrumentId,
                            Side = pos.Quantity > 0 ? "SELL" : "BUY",
                            OrderType = "MARKET",
                            Quantity = Math.Abs(pos.Quantity),
                            Price = tick.Price,
                            Status = "FILLED",
                            FilledQuantity = Math.Abs(pos.Quantity),
                            AvgFillPrice = tick.Price,
                            CreatedAt = DateTime.UtcNow,
                        };

                        await repo.AddAsync(tpOrder);

                        var pnl = pos.Quantity > 0
                            ? (tick.Price - pos.AvgPrice) * Math.Abs(pos.Quantity)
                            : (pos.AvgPrice - tick.Price) * Math.Abs(pos.Quantity);

                        pos.RealizedPnL += pnl;
                        pos.Quantity = 0;
                        pos.AvgPrice = 0;
                        pos.UnrealizedPnL = 0;
                        await posRepo.UpdateAsync(pos);

                        var tpTrade = new PaperTrade
                        {
                            OrderId = tpOrder.Id,
                            InstrumentId = pos.InstrumentId,
                            Price = tick.Price,
                            Quantity = Math.Abs(pos.Quantity),
                            Side = tpOrder.Side,
                            TradeTime = DateTime.UtcNow,
                        };
                        ctx.PaperTrades.Add(tpTrade);
                        await ctx.SaveChangesAsync();

                        OnOrderUpdated?.Invoke(tpOrder);
                        OnPositionUpdated?.Invoke(pos);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing tick for SL/TP checks");
        }
    }
}
