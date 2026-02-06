using IssabelCallMonitor.Services;
using Microsoft.AspNetCore.Mvc;

namespace IssabelCallMonitor.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CallsController : ControllerBase
    {
        private readonly AsteriskAmiService _amiService;

        public CallsController(AsteriskAmiService amiService)
        {
            _amiService = amiService;
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new
            {
                connected = _amiService.IsConnected,
                timestamp = DateTime.UtcNow
            });
        }

        [HttpPost("connect")]
        public async Task<IActionResult> Connect()
        {
            await _amiService.ConnectAsync();
            return Ok(new { message = "Connected" });
        }

        [HttpPost("disconnect")]
        public async Task<IActionResult> Disconnect()
        {
            await _amiService.DisconnectAsync();
            return Ok(new { message = "Disconnected" });
        }
    }
}
