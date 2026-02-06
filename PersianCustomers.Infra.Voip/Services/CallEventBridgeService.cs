using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using PersianCustomers.Infra.Voip.Hubs;

namespace PersianCustomers.Infra.Voip.Services
{
    public class CallEventBridgeService : BackgroundService
    {
        private readonly AsteriskAmiService _amiService;
        private readonly IHubContext<CallHub> _hubContext;
        private readonly ILogger<CallEventBridgeService> _logger;
        private IDisposable? _subscription;

        public CallEventBridgeService(
            AsteriskAmiService amiService,
            IHubContext<CallHub> hubContext,
            ILogger<CallEventBridgeService> logger)
        {
            _amiService = amiService;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                await _amiService.ConnectAsync();

                _subscription = _amiService.CallEvents.Subscribe(callEvent =>
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            if (!string.IsNullOrEmpty(callEvent.Extension))
                            {
                                await _hubContext.Clients.Group(callEvent.Extension)
                                    .SendAsync("CallEvent", callEvent, cancellationToken: stoppingToken);
                            }

                            await _hubContext.Clients.All
                                .SendAsync("CallEventAll", callEvent, cancellationToken: stoppingToken);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error broadcasting call event");
                        }
                    }, stoppingToken);
                });

                while (!stoppingToken.IsCancellationRequested)
                    await Task.Delay(1000, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CallEventBridgeService");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _subscription?.Dispose();
            await _amiService.DisconnectAsync();
            await base.StopAsync(cancellationToken);
        }
    }
}
