using System.Reactive.Subjects;
using IssabelCallMonitor.Models;

namespace PersianCustomers.Infra.Voip.Services
{
    public interface IAsteriskAmiService
    {
        IObservable<CallEvent> CallEvents { get; }
        Task ConnectAsync();
        Task DisconnectAsync();
        Task<List<CallRecording>> GetRecordingsAsync(DateTime from, DateTime to, string? extension = null);
        Task<Stream> GetRecordingStreamAsync(string fileName);
        Task<byte[]> DownloadRecordingAsync(string fileName);
        bool IsConnected { get; }
    }
}