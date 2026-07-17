namespace Tejvanta.Api.Infrastructure.Persistence;

public class PostgreSqlConfig
{
    public string ConnectionString { get; set; } = "Host=localhost;Database=tejvanta;Username=postgres;Password=postgres";
    public bool UsePostgreSql { get; set; } = false;
}
