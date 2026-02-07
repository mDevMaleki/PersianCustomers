using System.Diagnostics;
using System.Collections.Generic;
using Microsoft.Extensions.Options;
using PersianCustomers.EndPoints.WebApi.Options;

namespace PersianCustomers.EndPoints.WebApi.Services;

public class AsteriskRecordingSyncService : BackgroundService
{
    private readonly ILogger<AsteriskRecordingSyncService> _logger;
    private readonly IOptionsMonitor<AsteriskRecordingSyncOptions> _options;

    public AsteriskRecordingSyncService(
        ILogger<AsteriskRecordingSyncService> logger,
        IOptionsMonitor<AsteriskRecordingSyncOptions> options)
    {
        _logger = logger;
        _options = options;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = _options.CurrentValue;
        if (!options.Enabled)
        {
            _logger.LogInformation("Asterisk recording sync is disabled.");
            return;
        }

        _logger.LogInformation("Asterisk recording sync service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncOnceAsync(options, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Asterisk recording sync failed.");
            }

            await Task.Delay(TimeSpan.FromSeconds(options.IntervalSeconds), stoppingToken);
        }
    }

    private async Task SyncOnceAsync(AsteriskRecordingSyncOptions options, CancellationToken stoppingToken)
    {
        var password = ResolvePassword(options);
        if (string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("Asterisk recording sync skipped because SSH credentials are not configured.");
            return;
        }

        var rsyncPath = ResolveExecutablePath("rsync");
        if (string.IsNullOrWhiteSpace(rsyncPath))
        {
            _logger.LogWarning("Asterisk recording sync skipped because rsync was not found on the system PATH.");
            return;
        }

        Directory.CreateDirectory(options.DestinationDirectory);

        var tempFile = Path.GetTempFileName();
        await File.WriteAllTextAsync(tempFile, "#!/usr/bin/env bash\n" +
                                            $"printf '%s\\n' '{EscapePassword(password)}'\n", stoppingToken);
        if (OperatingSystem.IsLinux() || OperatingSystem.IsMacOS())
        {
            File.SetUnixFileMode(tempFile, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
        }

        try
        {
            using var process = new Process
            {
                StartInfo = CreateProcessStartInfo(options, tempFile, rsyncPath)
            };

            if (!process.Start())
            {
                _logger.LogError("Failed to start rsync process.");
                return;
            }

            var stdoutTask = process.StandardOutput.ReadToEndAsync(stoppingToken);
            var stderrTask = process.StandardError.ReadToEndAsync(stoppingToken);

            await process.WaitForExitAsync(stoppingToken);

            var stdout = await stdoutTask;
            var stderr = await stderrTask;

            if (!string.IsNullOrWhiteSpace(stdout))
            {
                _logger.LogInformation("Rsync output: {Output}", stdout.Trim());
            }

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("Rsync exited with code {ExitCode}. Error: {Error}",
                    process.ExitCode,
                    string.IsNullOrWhiteSpace(stderr) ? "(none)" : stderr.Trim());
            }
        }
        finally
        {
            File.Delete(tempFile);
        }
    }

    private static ProcessStartInfo CreateProcessStartInfo(
        AsteriskRecordingSyncOptions options,
        string askPassPath,
        string rsyncPath)
    {
        var remoteDir = options.RemoteDirectory.TrimEnd('/') + "/";
        var destDir = options.DestinationDirectory.TrimEnd('/') + "/";
        var remoteTarget = $"{options.RemoteUser}@{options.RemoteHost}:{remoteDir}";

        var startInfo = new ProcessStartInfo
        {
            FileName = rsyncPath,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        startInfo.ArgumentList.Add("-av");
        startInfo.ArgumentList.Add("-e");
        startInfo.ArgumentList.Add("ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null");
        startInfo.ArgumentList.Add("--include=*/");
        startInfo.ArgumentList.Add("--include=*.wav");
        startInfo.ArgumentList.Add("--exclude=*");
        startInfo.ArgumentList.Add("--ignore-existing");
        startInfo.ArgumentList.Add(remoteTarget);
        startInfo.ArgumentList.Add(destDir);

        startInfo.Environment["SSH_ASKPASS"] = askPassPath;
        startInfo.Environment["SSH_ASKPASS_REQUIRE"] = "force";
        startInfo.Environment["DISPLAY"] = "1";

        return startInfo;
    }

    private static string? ResolveExecutablePath(string executableName)
    {
        var pathValue = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(pathValue))
        {
            return null;
        }

        var extensions = new List<string> { string.Empty };
        if (OperatingSystem.IsWindows())
        {
            var pathext = Environment.GetEnvironmentVariable("PATHEXT");
            if (!string.IsNullOrWhiteSpace(pathext))
            {
                extensions.AddRange(pathext.Split(';', StringSplitOptions.RemoveEmptyEntries));
            }
        }

        foreach (var pathSegment in pathValue.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var trimmed = pathSegment.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                continue;
            }

            foreach (var extension in extensions)
            {
                var candidate = Path.Combine(trimmed, executableName + extension);
                if (File.Exists(candidate))
                {
                    return candidate;
                }
            }
        }

        return null;
    }

    private static string? ResolvePassword(AsteriskRecordingSyncOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.SshPassword))
        {
            return options.SshPassword.Trim();
        }

        if (!string.IsNullOrWhiteSpace(options.SshPasswordFile) && File.Exists(options.SshPasswordFile))
        {
            return File.ReadAllText(options.SshPasswordFile).Trim();
        }

        return null;
    }

    private static string EscapePassword(string password)
    {
        return password.Replace("'", "'\\''");
    }
}
