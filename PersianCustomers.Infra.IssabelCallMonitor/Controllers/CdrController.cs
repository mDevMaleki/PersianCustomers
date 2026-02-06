using IssabelCallMonitor.Models;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace IssabelCallMonitor.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CdrController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly ILogger<CdrController> _logger;

        public CdrController(IConfiguration config, ILogger<CdrController> logger)
        {
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Call history from CDR.
        /// Example:
        /// /api/cdr?from=2026-02-01&to=2026-02-05&extension=102
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCdr(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] string? extension = null,
            [FromQuery] int limit = 200)
        {
            if (limit < 1) limit = 1;
            if (limit > 2000) limit = 2000;

            var cs = _config.GetConnectionString("CdrDb");
            if (string.IsNullOrWhiteSpace(cs))
                return StatusCode(500, new { error = "Missing ConnectionStrings:CdrDb in appsettings.json" });

            // Make inclusive range if user passes only dates
            var fromLocal = from;
            var toLocal = to;
            if (toLocal.TimeOfDay == TimeSpan.Zero)
                toLocal = toLocal.AddDays(1).AddSeconds(-1);

            var results = new List<CdrRecord>();

            try
            {
                await using var conn = new MySqlConnection(cs);
                await conn.OpenAsync();

                var sql = @"
SELECT
  calldate,
  src,
  dst,
  disposition,
  duration,
  billsec,
  SEC_TO_TIME(duration) AS duration_hms,
  SEC_TO_TIME(billsec)  AS billsec_hms,
  uniqueid,
  IFNULL(linkedid,'') AS linkedid,
  IFNULL(dcontext,'') AS dcontext,
  IFNULL(lastapp,'') AS lastapp,
  IFNULL(lastdata,'') AS lastdata,
  IFNULL(recordingfile,'') AS recordingfile
FROM cdr
WHERE calldate >= @from AND calldate <= @to
  AND (IFNULL(@ext,'') = '' OR src = @ext OR dst = @ext)
ORDER BY calldate DESC
LIMIT " + limit + @";
";

                // NOTE: MariaDB doesn't always accept parameter for LIMIT reliably.
                // So we inline the limit safely after clamping 1..2000 above.

                await using var cmd = new MySqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@from", fromLocal);
                cmd.Parameters.AddWithValue("@to", toLocal);
                cmd.Parameters.AddWithValue("@ext", extension ?? "");

                await using var reader = await cmd.ExecuteReaderAsync();

while (await reader.ReadAsync())
{
    var durationTs = reader.GetTimeSpan("duration_hms");
    var billsecTs  = reader.GetTimeSpan("billsec_hms");

    var r = new CdrRecord
    {
        CallDate = reader.GetDateTime("calldate"),
        Src = reader.GetString("src"),
        Dst = reader.GetString("dst"),
        Disposition = reader.GetString("disposition"),
        Duration = reader.GetInt32("duration"),
        BillSec = reader.GetInt32("billsec"),

        // FIX: SEC_TO_TIME returns TimeSpan via MySqlConnector
        DurationHms = durationTs.ToString(@"hh\:mm\:ss"),
        BillSecHms  = billsecTs.ToString(@"hh\:mm\:ss"),

        UniqueId = reader.GetString("uniqueid"),
        LinkedId = reader.GetString("linkedid"),
        DContext = reader.GetString("dcontext"),
        LastApp = reader.GetString("lastapp"),
        LastData = reader.GetString("lastdata"),
        RecordingFile = reader.GetString("recordingfile"),
    };

    results.Add(r);
}


                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CDR query failed");
                return StatusCode(500, new
                {
                    error = "CDR query failed",
                    details = ex.Message
                });
            }
        }
    }
}
