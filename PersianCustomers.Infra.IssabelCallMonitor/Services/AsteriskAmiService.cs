using IssabelCallMonitor.Models;
using Microsoft.Extensions.Options;
using System.Net.Sockets;
using System.Reactive.Subjects;
using System.Text;
using System.Text.RegularExpressions;

namespace IssabelCallMonitor.Services
{
    public class AsteriskAmiService : IDisposable
    {
        private bool _disposed;

        private readonly IssabelConfiguration _config;
        private readonly ILogger<AsteriskAmiService> _logger;

        private readonly Subject<CallEvent> _callEventsSubject = new();
        public IObservable<CallEvent> CallEvents => _callEventsSubject;

        private TcpClient? _client;
        private NetworkStream? _stream;
        private StreamReader? _reader;
        private StreamWriter? _writer;
        private CancellationTokenSource? _cts;
        private Task? _readLoopTask;

        public bool IsConnected => _client?.Connected == true;

        public AsteriskAmiService(IOptions<IssabelConfiguration> config, ILogger<AsteriskAmiService> logger)
        {
            _config = config.Value;
            _logger = logger;
        }

        public async Task ConnectAsync()
        {
            if (IsConnected)
            {
                _logger.LogInformation("AMI already connected");
                return;
            }

            try
            {
                _cts = new CancellationTokenSource();

                _client = new TcpClient();
                await _client.ConnectAsync(_config.Server, _config.Port);

                _stream = _client.GetStream();
                _reader = new StreamReader(_stream, Encoding.ASCII, leaveOpen: true);
                _writer = new StreamWriter(_stream, Encoding.ASCII, leaveOpen: true)
                {
                    NewLine = "\r\n",
                    AutoFlush = true
                };

                // Read initial banner (optional)
                await ReadUntilBlankLine(_cts.Token);

                // Login
                var actionId = Guid.NewGuid().ToString("N");
                await SendActionAsync(new Dictionary<string, string>
                {
                    ["Action"] = "Login",
                    ["Username"] = _config.Username,
                    ["Secret"] = _config.Password,
                    ["Events"] = "on",
                    ["ActionID"] = actionId
                }, _cts.Token);

                // Wait for login response
                var loginResponse = await ReadMessageAsync(_cts.Token, timeoutMs: 5000);
                if (loginResponse == null ||
                    !loginResponse.TryGetValue("Response", out var resp) ||
                    !resp.Equals("Success", StringComparison.OrdinalIgnoreCase))
                {
                    var msg = loginResponse != null && loginResponse.TryGetValue("Message", out var m) ? m : "Unknown";
                    throw new Exception($"AMI login failed: {msg}");
                }

                _logger.LogInformation("AMI login success to {Server}:{Port}", _config.Server, _config.Port);

                // Start read loop for events
                _readLoopTask = Task.Run(() => ReadLoopAsync(_cts.Token));
            }
            catch
            {
                await DisconnectAsync();
                throw;
            }
        }

        public async Task DisconnectAsync()
        {
            try
            {
                _cts?.Cancel();

                if (_writer != null && IsConnected)
                {
                    try
                    {
                        await SendActionAsync(new Dictionary<string, string>
                        {
                            ["Action"] = "Logoff"
                        }, CancellationToken.None);
                    }
                    catch { /* ignore */ }
                }

                if (_readLoopTask != null)
                {
                    try { await _readLoopTask; } catch { /* ignore */ }
                }
            }
            finally
            {
                try { _reader?.Dispose(); } catch { }
                try { _writer?.Dispose(); } catch { }
                try { _stream?.Dispose(); } catch { }
                try { _client?.Close(); } catch { }
                try { _client?.Dispose(); } catch { }

                _reader = null;
                _writer = null;
                _stream = null;
                _client = null;

                _cts?.Dispose();
                _cts = null;

                _readLoopTask = null;

                _logger.LogInformation("AMI disconnected");
            }
        }

        private async Task ReadLoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested && IsConnected)
            {
                Dictionary<string, string>? msg = null;
                try
                {
                    msg = await ReadMessageAsync(ct, timeoutMs: 0);
                    if (msg == null) continue;

                    // AMI events contain "Event:"
                    if (!msg.TryGetValue("Event", out var eventName) || string.IsNullOrWhiteSpace(eventName))
                        continue;

                    var ce = MapToCallEvent(eventName, msg);
                    if (!string.IsNullOrEmpty(ce.Channel))
                    {
                        _callEventsSubject.OnNext(ce);
                        _logger.LogDebug("AMI Event {EventType} Channel={Channel} Ext={Ext}", ce.EventType, ce.Channel, ce.Extension);
                    }
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (IOException ex)
                {
                    _logger.LogWarning(ex, "AMI stream ended");
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "AMI read loop error");
                }
            }
        }

        private CallEvent MapToCallEvent(string eventName, Dictionary<string, string> msg)
        {
            var ce = new CallEvent
            {
                EventType = eventName,
                Timestamp = DateTime.UtcNow
            };

            // Channel
            if (TryGet(msg, "Channel", out var channel))
            {
                ce.Channel = channel;
                ce.Extension = ExtractExtension(channel);
            }

            // Caller ID (AMI keys vary)
            if (TryGet(msg, "CallerIDNum", out var cidNum) || TryGet(msg, "CallerIdNum", out cidNum))
                ce.CallerIdNum = cidNum;

            if (TryGet(msg, "CallerIDName", out var cidName) || TryGet(msg, "CallerIdName", out cidName))
                ce.CallerIdName = cidName;

            // Connected line (varies by event)
            if (TryGet(msg, "ConnectedLineNum", out var clNum) || TryGet(msg, "ConnectedLineNumber", out clNum))
                ce.ConnectedLineNum = clNum;

            if (TryGet(msg, "ConnectedLineName", out var clName))
                ce.ConnectedLineName = clName;

            // Unique / Linked
            if (TryGet(msg, "Uniqueid", out var uid) || TryGet(msg, "UniqueId", out uid))
                ce.UniqueId = uid;

            if (TryGet(msg, "Linkedid", out var lid) || TryGet(msg, "LinkedId", out lid))
                ce.LinkedId = lid;

            // Context
            if (TryGet(msg, "Context", out var ctx))
                ce.Context = ctx;

            // Recording file from VarSet
            if (eventName.Equals("VarSet", StringComparison.OrdinalIgnoreCase))
            {
                if (TryGet(msg, "Variable", out var variable) && TryGet(msg, "Value", out var value))
                {
                    if (variable.Equals("MONITOR_FILENAME", StringComparison.OrdinalIgnoreCase) ||
                        variable.Equals("MIXMONITOR_FILENAME", StringComparison.OrdinalIgnoreCase))
                    {
                        ce.EventType = "RecordingFile";
                        ce.RecordingFile = value;
                    }
                }
            }

            return ce;
        }

        private static bool TryGet(Dictionary<string, string> msg, string key, out string value)
        {
            if (msg.TryGetValue(key, out value!))
            {
                value = value?.Trim() ?? "";
                return !string.IsNullOrEmpty(value);
            }
            value = "";
            return false;
        }

        private static string ExtractExtension(string channel)
        {
            if (string.IsNullOrEmpty(channel))
                return string.Empty;

            var match = Regex.Match(channel, @"(SIP|IAX2|Local|PJSIP|DAHDI)/(\d+)");
            if (match.Success && match.Groups.Count >= 3)
                return match.Groups[2].Value;

            match = Regex.Match(channel, @"\d+");
            return match.Success ? match.Value : channel;
        }

        private async Task SendActionAsync(Dictionary<string, string> headers, CancellationToken ct)
        {
            if (_writer == null) throw new InvalidOperationException("AMI writer not ready");

            foreach (var kv in headers)
                await _writer.WriteLineAsync($"{kv.Key}: {kv.Value}");

            await _writer.WriteLineAsync(""); // blank line ends message
        }

        /// <summary>
        /// Reads one AMI message (response/event): lines until blank line.
        /// If timeoutMs = 0, waits indefinitely.
        /// </summary>
        private async Task<Dictionary<string, string>?> ReadMessageAsync(CancellationToken ct, int timeoutMs)
        {
            if (_reader == null) throw new InvalidOperationException("AMI reader not ready");

            using var timeoutCts = timeoutMs > 0 ? new CancellationTokenSource(timeoutMs) : null;
            using var linked = timeoutCts != null ? CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token) : null;
            var token = linked?.Token ?? ct;

            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            while (true)
            {
                var line = await _reader.ReadLineAsync(token);
                if (line == null)
                    throw new IOException("AMI connection closed");

                line = line.TrimEnd();
                if (line.Length == 0)
                    break;

                var idx = line.IndexOf(':');
                if (idx <= 0) continue;

                var key = line.Substring(0, idx).Trim();
                var value = line.Substring(idx + 1).Trim();

                // allow multi-line / duplicate keys by last-write (ok for our usage)
                dict[key] = value;
            }

            // empty message can happen; ignore
            if (dict.Count == 0) return null;
            return dict;
        }

        private async Task ReadUntilBlankLine(CancellationToken ct)
        {
            if (_reader == null) return;

            while (true)
            {
                var line = await _reader.ReadLineAsync(ct);
                if (line == null) return;
                if (string.IsNullOrWhiteSpace(line)) return;
            }
        }

        // ===========================
        // Recordings (local filesystem)
        // ===========================
        public async Task<List<CallRecording>> GetRecordingsAsync(DateTime from, DateTime to, string? extension = null)
        {
            var recordings = new List<CallRecording>();

            try
            {
                var path = _config.RecordingsPath;

                if (!Directory.Exists(path))
                {
                    _logger.LogWarning("RecordingsPath does not exist on this machine: {Path}", path);
                    return recordings;
                }

                await SearchForRecordings(path, from, to, extension, recordings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recordings");
            }

            return recordings.OrderByDescending(r => r.CallDate).ToList();
        }

        private static Task SearchForRecordings(string path, DateTime from, DateTime to, string? extension, List<CallRecording> recordings)
        {
            var fromUtc = from.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(from, DateTimeKind.Local).ToUniversalTime()
                : from.ToUniversalTime();

            var toUtc = to.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(to, DateTimeKind.Local).ToUniversalTime()
                : to.ToUniversalTime();

            if (toUtc.TimeOfDay == TimeSpan.Zero)
                toUtc = toUtc.AddDays(1).AddSeconds(-1);

            var patterns = new[] { "*.wav", "*.mp3", "*.gsm", "*.ogg" };

            foreach (var pattern in patterns)
            {
                string[] files;
                try { files = Directory.GetFiles(path, pattern, SearchOption.AllDirectories); }
                catch { continue; }

                foreach (var filePath in files)
                {
                    FileInfo fi;
                    try { fi = new FileInfo(filePath); } catch { continue; }

                    var t = fi.LastWriteTimeUtc;
                    if (t < fromUtc || t > toUtc) continue;

                    var rec = CreateRecording(filePath, fi, extension);
                    if (rec != null) recordings.Add(rec);
                }
            }

            return Task.CompletedTask;
        }

        private static CallRecording? CreateRecording(string filePath, FileInfo fileInfo, string? extensionFilter)
        {
            try
            {
                var nameNoExt = Path.GetFileNameWithoutExtension(filePath);
                var ext = Path.GetExtension(filePath).ToLowerInvariant();

                var parsed = ParseFileName(nameNoExt);
                if (parsed.Extension == null) return null;

                if (!string.IsNullOrEmpty(extensionFilter) &&
                    !parsed.Extension.Equals(extensionFilter, StringComparison.OrdinalIgnoreCase))
                    return null;

                var fileNameOnly = Path.GetFileName(filePath);

                return new CallRecording
                {
                    CallId = Guid.NewGuid().ToString(),
                    FileName = fileNameOnly,
                    FilePath = filePath,
                    CallDate = fileInfo.LastWriteTime,
                    CallerId = parsed.CallerId ?? "Unknown",
                    CalledNumber = parsed.Extension,
                    FileSize = fileInfo.Length,
                    Duration = EstimateDuration(fileInfo, ext),

                    // IMPORTANT: URLs for your UI
                    StreamUrl = $"/api/recordings/stream/{Uri.EscapeDataString(fileNameOnly)}",
                    DownloadUrl = $"/api/recordings/download/{Uri.EscapeDataString(fileNameOnly)}",
                };
            }
            catch
            {
                return null;
            }
        }

        private static (string? Extension, string? CallerId) ParseFileName(string fileName)
        {
            var parts = fileName.Split(new[] { '-', '_' }, StringSplitOptions.RemoveEmptyEntries);

            string? extension = null;
            string? callerId = null;

            foreach (var part in parts)
            {
                if (part.Length == 8 && part.All(char.IsDigit)) continue;
                if (part.Length == 6 && part.All(char.IsDigit)) continue;

                if (part.All(char.IsDigit) && part.Length >= 2 && part.Length <= 6)
                    extension ??= part;

                if (part.All(char.IsDigit) && part.Length >= 7)
                    callerId ??= part;
            }

            return (extension, callerId);
        }

        private static TimeSpan EstimateDuration(FileInfo fileInfo, string extension)
        {
            double bytesPerSecond = extension switch
            {
                ".wav" => 16000,
                ".mp3" => 8000,
                ".gsm" => 4000,
                ".ogg" => 6000,
                _ => 8000
            };

            var seconds = fileInfo.Length / bytesPerSecond;
            return TimeSpan.FromSeconds(Math.Max(1, Math.Min(3600, seconds)));
        }

        public Task<Stream> GetRecordingStreamAsync(string fileName)
        {
            // Safety: only allow filenames (strip any path parts)
            var decoded = Uri.UnescapeDataString(fileName);
            var safeName = Path.GetFileName(decoded);

            var filePath = FindRecordingFileRecursive(safeName);
            if (string.IsNullOrEmpty(filePath))
                throw new FileNotFoundException($"Recording not found: {fileName}");

            Stream s = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            return Task.FromResult(s);
        }


        private string? FindRecordingFileRecursive(string fileNameOnly)
        {
            // 1) Direct check (if file is in base folder)
            var direct = Path.Combine(_config.RecordingsPath, fileNameOnly);
            if (File.Exists(direct)) return direct;

            // 2) Recursive search (for /YYYY/MM/DD/ folders)
            try
            {
                if (!Directory.Exists(_config.RecordingsPath)) return null;

                var matches = Directory.GetFiles(_config.RecordingsPath, fileNameOnly, SearchOption.AllDirectories);
                return matches.FirstOrDefault();
            }
            catch
            {
                return null;
            }
        }

        public async Task<byte[]> DownloadRecordingAsync(string fileName)
        {
            using var stream = await GetRecordingStreamAsync(fileName);
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms);
            return ms.ToArray();
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;

            try { _callEventsSubject.Dispose(); } catch { }
            try { DisconnectAsync().GetAwaiter().GetResult(); } catch { }

            GC.SuppressFinalize(this);
        }
    }
}

// using Asterisk.NET.Manager;
// using IssabelCallMonitor.Models;
// using Microsoft.Extensions.Options;
// using System.Reactive.Subjects;
// using System.Text.RegularExpressions;

// namespace IssabelCallMonitor.Services
// {
//     public class AsteriskAmiService : IDisposable
//     {
//         private readonly IssabelConfiguration _config;
//         private readonly ILogger<AsteriskAmiService> _logger;

//         private readonly Subject<CallEvent> _callEventsSubject = new();
//         private ManagerConnection? _manager;
//         private bool _disposed;

//         public IObservable<CallEvent> CallEvents => _callEventsSubject;
//         public bool IsConnected => _manager != null && _manager.IsConnected();

//         public AsteriskAmiService(IOptions<IssabelConfiguration> config, ILogger<AsteriskAmiService> logger)
//         {
//             _config = config.Value;
//             _logger = logger;
//         }

//         public Task ConnectAsync()
//         {
//             try
//             {
//                 if (IsConnected)
//                 {
//                     _logger.LogInformation("AMI already connected");
//                     return Task.CompletedTask;
//                 }

//                 // IMPORTANT: constructor signature for your Asterisk.NET version:
//                 // ManagerConnection(string server, int port, string username, string password)
//                 _manager = new ManagerConnection(_config.Server, _config.Port, _config.Username, _config.Password);

//                 _manager.UnhandledEvent += OnManagerEvent;
//                 _manager.Login();

//                 if (!_manager.IsConnected())
//                     throw new Exception("AMI login did not connect (IsConnected == false)");

//                 _logger.LogInformation("Connected to AMI {Server}:{Port} as {User}", _config.Server, _config.Port, _config.Username);

//                 return Task.CompletedTask;
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Failed to connect to Asterisk AMI");
//                 throw;
//             }
//         }

//         private void OnManagerEvent(object? sender, object e)
//         {
//             try
//             {
//                 var callEvent = new CallEvent
//                 {
//                     EventType = e.GetType().Name.Replace("Event", ""),
//                     Timestamp = DateTime.UtcNow
//                 };

//                 var type = e.GetType();

//                 // Channel
//                 var channelProp = type.GetProperty("Channel");
//                 if (channelProp?.GetValue(e) is string channel && !string.IsNullOrWhiteSpace(channel))
//                 {
//                     callEvent.Channel = channel;
//                     callEvent.Extension = ExtractExtension(channel);
//                 }

//                 // Caller ID
//                 var callerIdNumProp = type.GetProperty("CallerIdNum") ?? type.GetProperty("CallerIDNum");
//                 if (callerIdNumProp?.GetValue(e) is string callerNum && !string.IsNullOrWhiteSpace(callerNum))
//                     callEvent.CallerIdNum = callerNum;

//                 var callerIdNameProp = type.GetProperty("CallerIdName") ?? type.GetProperty("CallerIDName");
//                 if (callerIdNameProp?.GetValue(e) is string callerName && !string.IsNullOrWhiteSpace(callerName))
//                     callEvent.CallerIdName = callerName;

//                 // Connected Line (some events have these)
//                 var connNumProp = type.GetProperty("ConnectedLineNum") ?? type.GetProperty("ConnectedLineNumber");
//                 if (connNumProp?.GetValue(e) is string connNum && !string.IsNullOrWhiteSpace(connNum))
//                     callEvent.ConnectedLineNum = connNum;

//                 var connNameProp = type.GetProperty("ConnectedLineName");
//                 if (connNameProp?.GetValue(e) is string connName && !string.IsNullOrWhiteSpace(connName))
//                     callEvent.ConnectedLineName = connName;

//                 // UniqueId + LinkedId
//                 var uniqueIdProp = type.GetProperty("UniqueId") ?? type.GetProperty("UniqueID");
//                 if (uniqueIdProp?.GetValue(e) is string uid && !string.IsNullOrWhiteSpace(uid))
//                     callEvent.UniqueId = uid;

//                 var linkedIdProp = type.GetProperty("LinkedId") ?? type.GetProperty("LinkedID");
//                 if (linkedIdProp?.GetValue(e) is string lid && !string.IsNullOrWhiteSpace(lid))
//                     callEvent.LinkedId = lid;

//                 // Context
//                 var ctxProp = type.GetProperty("Context");
//                 if (ctxProp?.GetValue(e) is string ctx && !string.IsNullOrWhiteSpace(ctx))
//                     callEvent.Context = ctx;

//                 // Recording filename from VarSet (common)
//                 var variableProp = type.GetProperty("Variable");
//                 var valueProp = type.GetProperty("Value");
//                 if (variableProp != null && valueProp != null)
//                 {
//                     var variable = variableProp.GetValue(e) as string;
//                     var value = valueProp.GetValue(e) as string;

//                     if (!string.IsNullOrEmpty(variable) &&
//                         (variable.Equals("MONITOR_FILENAME", StringComparison.OrdinalIgnoreCase) ||
//                          variable.Equals("MIXMONITOR_FILENAME", StringComparison.OrdinalIgnoreCase)))
//                     {
//                         callEvent.EventType = "RecordingFile";
//                         callEvent.RecordingFile = value ?? string.Empty;
//                         _logger.LogInformation("Recording file event: {File}", value);
//                     }
//                 }

//                 // Publish only if channel exists
//                 if (!string.IsNullOrEmpty(callEvent.Channel))
//                 {
//                     _callEventsSubject.OnNext(callEvent);
//                     _logger.LogDebug("AMI Event: {EventType} - {Channel}", callEvent.EventType, callEvent.Channel);
//                 }
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogDebug(ex, "Error processing AMI event");
//             }
//         }

//         private static string ExtractExtension(string channel)
//         {
//             if (string.IsNullOrEmpty(channel)) return string.Empty;

//             var match = Regex.Match(channel, @"(SIP|IAX2|Local|PJSIP|DAHDI)/(\d+)");
//             if (match.Success && match.Groups.Count >= 3)
//                 return match.Groups[2].Value;

//             match = Regex.Match(channel, @"\d+");
//             return match.Success ? match.Value : channel;
//         }

//         public async Task<List<CallRecording>> GetRecordingsAsync(DateTime from, DateTime to, string? extension = null)
//         {
//             var recordings = new List<CallRecording>();

//             try
//             {
//                 var path = _config.RecordingsPath;

//                 if (!Directory.Exists(path))
//                 {
//                     var alt = FindRecordingsDirectory();
//                     if (!string.IsNullOrEmpty(alt)) path = alt;
//                 }

//                 if (!Directory.Exists(path))
//                 {
//                     _logger.LogWarning("Recordings directory not found: {Path}", path);
//                     return recordings;
//                 }

//                 await SearchForRecordings(path, from, to, extension, recordings);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error getting recordings");
//             }

//             return recordings.OrderByDescending(r => r.CallDate).ToList();
//         }

//         private string? FindRecordingsDirectory()
//         {
//             var possiblePaths = new[]
//             {
//                 _config.RecordingsPath,
//                 "/var/spool/asterisk/monitor",
//                 "/var/lib/asterisk/monitor",
//                 "/var/www/html/panel/modules/recordings/files",
//                 "/usr/local/issabel/www/panel/modules/recordings/files"
//             };

//             foreach (var p in possiblePaths)
//             {
//                 try
//                 {
//                     if (Directory.Exists(p))
//                     {
//                         _logger.LogInformation("Found recordings path: {Path}", p);
//                         return p;
//                     }
//                 }
//                 catch { }
//             }
//             return null;
//         }

//         private static Task SearchForRecordings(
//             string path,
//             DateTime from,
//             DateTime to,
//             string? extension,
//             List<CallRecording> recordings)
//         {
//             var fromUtc = from.Kind == DateTimeKind.Unspecified
//                 ? DateTime.SpecifyKind(from, DateTimeKind.Local).ToUniversalTime()
//                 : from.ToUniversalTime();

//             var toUtc = to.Kind == DateTimeKind.Unspecified
//                 ? DateTime.SpecifyKind(to, DateTimeKind.Local).ToUniversalTime()
//                 : to.ToUniversalTime();

//             if (toUtc.TimeOfDay == TimeSpan.Zero)
//                 toUtc = toUtc.AddDays(1).AddSeconds(-1);

//             var patterns = new[] { "*.wav", "*.mp3", "*.gsm", "*.ogg" };

//             foreach (var pattern in patterns)
//             {
//                 string[] files;
//                 try
//                 {
//                     files = Directory.GetFiles(path, pattern, SearchOption.AllDirectories);
//                 }
//                 catch
//                 {
//                     continue;
//                 }

//                 foreach (var filePath in files)
//                 {
//                     FileInfo fi;
//                     try { fi = new FileInfo(filePath); }
//                     catch { continue; }

//                     var t = fi.LastWriteTimeUtc;
//                     if (t < fromUtc || t > toUtc) continue;

//                     var rec = CreateRecording(filePath, fi, extension);
//                     if (rec != null) recordings.Add(rec);
//                 }
//             }

//             return Task.CompletedTask;
//         }

//         private static CallRecording? CreateRecording(string filePath, FileInfo fileInfo, string? extensionFilter)
//         {
//             try
//             {
//                 var nameNoExt = Path.GetFileNameWithoutExtension(filePath);
//                 var ext = Path.GetExtension(filePath).ToLowerInvariant();

//                 var parsed = ParseFileName(nameNoExt);
//                 if (parsed.Extension == null) return null;

//                 if (!string.IsNullOrEmpty(extensionFilter) &&
//                     !parsed.Extension.Equals(extensionFilter, StringComparison.OrdinalIgnoreCase))
//                     return null;

//                 return new CallRecording
//                 {
//                     CallId = Guid.NewGuid().ToString(),
//                     FileName = Path.GetFileName(filePath),
//                     FilePath = filePath,
//                     CallDate = fileInfo.LastWriteTime,
//                     CallerId = parsed.CallerId ?? "Unknown",
//                     CalledNumber = parsed.Extension,
//                     FileSize = fileInfo.Length,
//                     Duration = EstimateDuration(fileInfo, ext)
//                 };
//             }
//             catch
//             {
//                 return null;
//             }
//         }

//         private static (string? Extension, string? CallerId) ParseFileName(string fileName)
//         {
//             var parts = fileName.Split(new[] { '-', '_' }, StringSplitOptions.RemoveEmptyEntries);

//             string? extension = null;
//             string? callerId = null;

//             foreach (var part in parts)
//             {
//                 if (part.Length == 8 && part.All(char.IsDigit)) continue; // YYYYMMDD
//                 if (part.Length == 6 && part.All(char.IsDigit)) continue; // HHMMSS

//                 if (part.All(char.IsDigit) && part.Length >= 2 && part.Length <= 6)
//                     extension ??= part;

//                 if (part.All(char.IsDigit) && part.Length >= 7)
//                     callerId ??= part;
//             }

//             return (extension, callerId);
//         }

//         private static TimeSpan EstimateDuration(FileInfo fileInfo, string extension)
//         {
//             double bytesPerSecond = extension switch
//             {
//                 ".wav" => 16000,
//                 ".mp3" => 8000,
//                 ".gsm" => 4000,
//                 ".ogg" => 6000,
//                 _ => 8000
//             };

//             var seconds = fileInfo.Length / bytesPerSecond;
//             return TimeSpan.FromSeconds(Math.Max(1, Math.Min(3600, seconds)));
//         }

//         public Task<Stream> GetRecordingStreamAsync(string fileName)
//         {
//             var decoded = Uri.UnescapeDataString(fileName);
//             var filePath = FindRecordingFile(decoded);

//             if (string.IsNullOrEmpty(filePath))
//                 throw new FileNotFoundException($"Recording not found: {fileName}");

//             Stream s = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
//             return Task.FromResult(s);
//         }

//         private string? FindRecordingFile(string fileName)
//         {
//             var direct = Path.Combine(_config.RecordingsPath, fileName);
//             if (File.Exists(direct)) return direct;

//             try
//             {
//                 if (!Directory.Exists(_config.RecordingsPath)) return null;
//                 var files = Directory.GetFiles(_config.RecordingsPath, fileName, SearchOption.AllDirectories);
//                 return files.FirstOrDefault();
//             }
//             catch
//             {
//                 return null;
//             }
//         }

//         public async Task<byte[]> DownloadRecordingAsync(string fileName)
//         {
//             using var stream = await GetRecordingStreamAsync(fileName);
//             using var ms = new MemoryStream();
//             await stream.CopyToAsync(ms);
//             return ms.ToArray();
//         }

//         public Task DisconnectAsync()
//         {
//             try
//             {
//                 if (_manager != null && _manager.IsConnected())
//                 {
//                     _manager.Logoff();
//                     _logger.LogInformation("Disconnected from Asterisk AMI");
//                 }
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error disconnecting AMI");
//             }

//             return Task.CompletedTask;
//         }

//         public void Dispose()
//         {
//             if (_disposed) return;

//             try
//             {
//                 _callEventsSubject.Dispose();

//                 // Asterisk.NET ManagerConnection in your version does NOT implement IDisposable
//                 // so do not call _manager.Dispose()
//                 _manager = null;
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error during dispose");
//             }
//             finally
//             {
//                 _disposed = true;
//             }

//             GC.SuppressFinalize(this);
//         }
//     }
// }