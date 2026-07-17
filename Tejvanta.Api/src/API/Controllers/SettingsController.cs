using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Infrastructure.Persistence;
using Tejvanta.Api.Domain.Entities;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SettingsController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<SettingsDto>> GetSettings()
    {
        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == 1);
        if (settings == null)
        {
            settings = new UserSettings { UserId = 1 };
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return Ok(new SettingsDto(
            settings.Theme, settings.DefaultTimeframe,
            settings.DefaultLayout, settings.Timezone, settings.VirtualBalance
        ));
    }

    [HttpPost]
    public async Task<ActionResult<SettingsDto>> UpdateSettings([FromBody] UpdateSettingsRequest request)
    {
        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == 1);
        if (settings == null)
        {
            settings = new UserSettings { UserId = 1 };
            _context.UserSettings.Add(settings);
        }

        if (request.Theme != null) settings.Theme = request.Theme;
        if (request.DefaultTimeframe != null) settings.DefaultTimeframe = request.DefaultTimeframe;
        if (request.DefaultLayout.HasValue) settings.DefaultLayout = request.DefaultLayout.Value;
        if (request.Timezone != null) settings.Timezone = request.Timezone;

        settings.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new SettingsDto(
            settings.Theme, settings.DefaultTimeframe,
            settings.DefaultLayout, settings.Timezone, settings.VirtualBalance
        ));
    }
}
