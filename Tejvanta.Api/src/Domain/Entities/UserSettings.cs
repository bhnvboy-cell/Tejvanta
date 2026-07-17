namespace Tejvanta.Api.Domain.Entities;

public class UserSettings
{
    public int Id { get; set; }
    public int UserId { get; set; } = 1;
    public string Theme { get; set; } = "dark";
    public string DefaultTimeframe { get; set; } = "1D";
    public int DefaultLayout { get; set; } = 1;
    public string Timezone { get; set; } = "Asia/Kolkata";
    public decimal VirtualBalance { get; set; } = 1000000;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
