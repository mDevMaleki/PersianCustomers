namespace IssabelCallMonitor.Services
{
    public static class AudioHelper
    {
        public static TimeSpan GetAudioDuration(string filePath)
        {
            try
            {
                var fileInfo = new FileInfo(filePath);
                var extension = Path.GetExtension(filePath).ToLower();
                
                // Simple estimation based on file size
                return extension switch
                {
                    ".wav" => TimeSpan.FromSeconds(fileInfo.Length / 16000), // PCM 16kHz
                    ".mp3" => TimeSpan.FromSeconds(fileInfo.Length / 8000),  // MP3
                    ".gsm" => TimeSpan.FromSeconds(fileInfo.Length / 4000),  // GSM
                    _ => TimeSpan.FromSeconds(fileInfo.Length / 8000)        // Default
                };
            }
            catch
            {
                return TimeSpan.Zero;
            }
        }
    }
}