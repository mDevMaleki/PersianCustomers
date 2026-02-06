namespace IssabelCallMonitor.Models
{
    public class CdrRecord
    {
        public DateTime CallDate { get; set; }

        public string Src { get; set; } = "";
        public string Dst { get; set; } = "";

        public string Disposition { get; set; } = "";

        // Seconds from CDR
        public int Duration { get; set; }   // total duration (often includes ringing)
        public int BillSec { get; set; }    // talk time (usually what people want)

        // Human readable (HH:MM:SS) computed in SQL
        public string DurationHms { get; set; } = "";
        public string BillSecHms { get; set; } = "";

        public string UniqueId { get; set; } = "";
        public string LinkedId { get; set; } = "";

        public string DContext { get; set; } = "";
        public string LastApp { get; set; } = "";
        public string LastData { get; set; } = "";

        public string RecordingFile { get; set; } = "";

        public bool Answered => Disposition.Equals("ANSWERED", StringComparison.OrdinalIgnoreCase);
    }
}
