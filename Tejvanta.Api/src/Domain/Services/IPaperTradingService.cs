using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.Domain.Services;

public interface IPaperTradingService
{
    Task<PaperOrder> PlaceOrderAsync(PaperOrder order);
    Task<bool> CancelOrderAsync(int orderId);
    Task<List<PaperOrder>> GetOpenOrdersAsync(int userId);
    Task<List<PaperOrder>> GetAllOrdersAsync(int userId);
    Task<List<PaperPosition>> GetPositionsAsync(int userId);
    Task<PaperPosition?> GetPositionAsync(int userId, int instrumentId);
    Task<bool> ClosePositionAsync(int userId, int instrumentId);
    Task<bool> ReversePositionAsync(int userId, int instrumentId);
    Task<decimal> GetVirtualBalanceAsync(int userId);
    Task<decimal> GetUsedMarginAsync(int userId);
    event Action<PaperOrder>? OnOrderUpdated;
    event Action<PaperPosition>? OnPositionUpdated;
}
