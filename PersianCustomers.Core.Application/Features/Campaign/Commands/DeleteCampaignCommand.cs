using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;

namespace PersianCustomers.Core.Application.Features.Campaign.Commands
{
    public record DeleteCampaignCommand(long Id) : ICommand<BaseResponse<bool>>;
}
