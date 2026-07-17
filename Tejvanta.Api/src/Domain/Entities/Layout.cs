namespace Tejvanta.Api.Domain.Entities;

public class Layout
{
    public int Id { get; set; }
    public int UserId { get; set; } = 1;
    public string Name { get; set; } = "Default";
    public string ConfigJson { get; set; } = "{}";
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
