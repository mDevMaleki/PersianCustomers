using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PersianCustomers.EndPoints.WebApi.Options;
using System.Globalization;
using System.Text.RegularExpressions;

namespace PersianCustomers.EndPoints.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecordingsController : ControllerBase
    {
        private readonly AsteriskRecordingOptions _options;
        private static readonly Regex DateRegex = new Regex(@"\b(\d{8})\b", RegexOptions.Compiled);

        public RecordingsController(IOptions<AsteriskRecordingOptions> options)
        {
            _options = options.Value;
        }

        [HttpGet("stream/{recordingFile}")]
        public IActionResult Stream(string recordingFile)
        {
            if (string.IsNullOrWhiteSpace(recordingFile))
            {
                return BadRequest("مسیر فایل نامعتبر است.");
            }

            if (string.IsNullOrWhiteSpace(_options.BasePath))
            {
                return NotFound("مسیر فایل‌ها تنظیم نشده است.");
            }

            var decoded = Uri.UnescapeDataString(recordingFile).Replace('\\', '/');
            var basePath = Path.GetFullPath(_options.BasePath);
            if (!basePath.EndsWith(Path.DirectorySeparatorChar))
            {
                basePath += Path.DirectorySeparatorChar;
            }

            foreach (var candidate in BuildCandidatePaths(decoded, basePath))
            {
                var fullPath = Path.GetFullPath(candidate);
                if (!fullPath.StartsWith(basePath, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (System.IO.File.Exists(fullPath))
                {
                    return PhysicalFile(fullPath, "audio/wav", enableRangeProcessing: true);
                }
            }

            return NotFound("فایل ضبط تماس پیدا نشد.");
        }

        private static IEnumerable<string> BuildCandidatePaths(string recordingFile, string basePath)
        {
            if (Path.IsPathRooted(recordingFile))
            {
                yield return recordingFile;
                yield break;
            }

            yield return Path.Combine(basePath, recordingFile);

            if (recordingFile.Contains('/'))
            {
                yield break;
            }

            var date = ExtractDate(recordingFile);
            if (date.HasValue)
            {
                yield return Path.Combine(
                    basePath,
                    date.Value.Year.ToString("0000"),
                    date.Value.Month.ToString("00"),
                    date.Value.Day.ToString("00"),
                    recordingFile);
            }
        }

        private static DateTime? ExtractDate(string recordingFile)
        {
            var match = DateRegex.Match(recordingFile);
            if (!match.Success)
            {
                return null;
            }

            if (DateTime.TryParseExact(match.Groups[1].Value, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                return date;
            }

            return null;
        }
    }
}
