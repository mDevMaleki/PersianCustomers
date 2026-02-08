using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Campaign.DTOs;

namespace PersianCustomers.Core.Application.Features.Campaign.Queries
{
    public record GetAllCampaignsQuery(int PageNumber = 1, int PageSize = 10)
        : IQuery<BaseResponse<PaginatedResult<CampaignDto>>>;
}
