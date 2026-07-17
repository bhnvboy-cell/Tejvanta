namespace Tejvanta.Api.Domain.ValueObjects;

public enum OrderSide { BUY, SELL }
public enum OrderType { MARKET, LIMIT, SL, SLM }
public enum OrderStatus { PENDING, OPEN, PARTIALLY_FILLED, FILLED, CANCELLED, REJECTED }
public enum OptionType { CE, PE }
public enum Timeframe { _1m, _5m, _15m, _30m, _1h, _4h, _1D, _1W, _1M }
