namespace PersianCustomers.EndPoints.WebApi.Options
{
    public class AsteriskRecordingOptions
    {
        public string BasePath { get; set; } = "/var/spool/asterisk/monitor";
    }

    public class AsteriskRecordingSyncOptions
    {
        public bool Enabled { get; set; } = false;
        public string RemoteHost { get; set; } = "193.151.152.32";
        public string RemoteUser { get; set; } = "root";
        public string RemoteDirectory { get; set; } = "/var/spool/asterisk/monitor/2026/02/04";
        public string DestinationDirectory { get; set; } = "/var/local/recordings/2026/02/04";
        public int IntervalSeconds { get; set; } = 30;
        public string? SshPassword { get; set; }
        public string? SshPasswordFile { get; set; }
    }
}
