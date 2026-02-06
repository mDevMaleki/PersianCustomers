using Microsoft.AspNetCore.SignalR;

namespace PersianCustomers.Infra.Voip.Hubs
{
    public class CallHub : Hub
    {
        public Task SubscribeToCalls(string extension)
            => Groups.AddToGroupAsync(Context.ConnectionId, extension);

        public Task UnsubscribeFromCalls(string extension)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, extension);
    }
}
