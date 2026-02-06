using System;

namespace IssabelCallMonitor.Models
{
    public class IssabelConfiguration
    {
        public string Server { get; set; } = "localhost";
        public int Port { get; set; } = 5038;
        public string Username { get; set; } = "admin";
        public string Password { get; set; } = "amp111";
        public string RecordingsPath { get; set; } = "/var/spool/asterisk/monitor/";
    }

    public class CallEvent
    {
        public string EventType { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;

        public string CallerIdNum { get; set; } = string.Empty;
        public string CallerIdName { get; set; } = string.Empty;

        public string ConnectedLineNum { get; set; } = string.Empty;
        public string ConnectedLineName { get; set; } = string.Empty;

        public string Extension { get; set; } = string.Empty;

        public string UniqueId { get; set; } = string.Empty;
        public string LinkedId { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; }

        public string Context { get; set; } = string.Empty;

        public string RecordingFile { get; set; } = string.Empty;
    }

    public class CallRecording
    {
        public string CallId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;

        public DateTime CallDate { get; set; }

        public string CallerId { get; set; } = string.Empty;
        public string CalledNumber { get; set; } = string.Empty;

        public TimeSpan Duration { get; set; }
        public long FileSize { get; set; }

        // these will be built by the API service
        public string DownloadUrl { get; set; } = string.Empty;
        public string StreamUrl { get; set; } = string.Empty;
    }
}
