namespace Tejvanta.Api.Domain.Entities;

public enum DataSourceType
{
    Simulation
}

public enum ConnectionState
{
    Disconnected,
    Connecting,
    Connected,
    Error
}

public record DataConnectionStatus(
    DataSourceType Source = DataSourceType.Simulation,
    ConnectionState State = ConnectionState.Disconnected,
    string? Message = null
);
