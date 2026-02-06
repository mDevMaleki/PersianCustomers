using IssabelCallMonitor.Services;
using Microsoft.AspNetCore.Mvc;

namespace IssabelCallMonitor.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecordingsController : ControllerBase
    {
        private readonly AsteriskAmiService _amiService;

        public RecordingsController(AsteriskAmiService amiService)
        {
            _amiService = amiService;
        }

        [HttpGet]
        public async Task<IActionResult> GetRecordings(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] string? extension = null)
        {
            var recordings = await _amiService.GetRecordingsAsync(from, to, extension);

            // build urls that your index.html uses
            foreach (var r in recordings)
            {
                var escaped = Uri.EscapeDataString(r.FileName);
                r.StreamUrl = $"/api/recordings/stream/{escaped}";
                r.DownloadUrl = $"/api/recordings/download/{escaped}";
            }

            return Ok(recordings);
        }

        [HttpGet("stream/{fileName}")]
        public async Task<IActionResult> StreamRecording(string fileName)
        {
            var stream = await _amiService.GetRecordingStreamAsync(fileName);
            var contentType = GetContentType(fileName);
            return File(stream, contentType, enableRangeProcessing: true);
        }

        [HttpGet("download/{fileName}")]
        public async Task<IActionResult> DownloadRecording(string fileName)
        {
            var bytes = await _amiService.DownloadRecordingAsync(fileName);
            var contentType = GetContentType(fileName);
            return File(bytes, contentType, fileName);
        }

        private static string GetContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".wav" => "audio/wav",
                ".mp3" => "audio/mpeg",
                ".gsm" => "audio/x-gsm",
                ".ogg" => "audio/ogg",
                _ => "application/octet-stream"
            };
        }
    }
}
