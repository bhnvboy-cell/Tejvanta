using Microsoft.AspNetCore.Mvc;
using Tejvanta.Api.Application.DTOs;
using Tejvanta.Api.Application.UseCases;

namespace Tejvanta.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly PlaceOrderHandler _placeOrder;
    private readonly CancelOrderHandler _cancelOrder;
    private readonly GetOrdersHandler _getOrders;

    public OrdersController(
        PlaceOrderHandler placeOrder,
        CancelOrderHandler cancelOrder,
        GetOrdersHandler getOrders)
    {
        _placeOrder = placeOrder;
        _cancelOrder = cancelOrder;
        _getOrders = getOrders;
    }

    [HttpPost("place")]
    public async Task<ActionResult<OrderDto>> PlaceOrder([FromBody] PlaceOrderRequest request)
    {
        try
        {
            var order = await _placeOrder.HandleAsync(request);
            return Ok(order);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("cancel")]
    public async Task<ActionResult> CancelOrder([FromBody] CancelOrderRequest request)
    {
        var result = await _cancelOrder.HandleAsync(request);
        if (!result) return NotFound("Order not found or already filled/cancelled");
        return Ok();
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders([FromQuery] bool openOnly = false)
    {
        var orders = await _getOrders.HandleAsync(1, openOnly);
        return Ok(orders);
    }
}
