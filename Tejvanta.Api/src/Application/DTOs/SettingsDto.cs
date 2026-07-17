namespace Tejvanta.Api.Application.DTOs;

public record SettingsDto(
    string Theme,
    string DefaultTimeframe,
    int DefaultLayout,
    string Timezone,
    decimal VirtualBalance
);

public record UpdateSettingsRequest(
    string? Theme,
    string? DefaultTimeframe,
    int? DefaultLayout,
    string? Timezone
);
