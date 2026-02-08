using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Campaign.DTOs;
using PersianCustomers.Core.Application.Features.Campaign.Queries;

namespace PersianCustomers.Core.Application.Features.Campaign.Handlers
{
    public class GetAllCampaignsHandler : IQueryHandler<GetAllCampaignsQuery, BaseResponse<PaginatedResult<CampaignDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GetAllCampaignsHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<PaginatedResult<CampaignDto>>> Handle(GetAllCampaignsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var campaignsQuery = await _unitOfWork.Campaigns.GetAllQueryableAsync();

                var totalCount = await campaignsQuery.CountAsync(cancellationToken);

                var campaigns = await campaignsQuery
                    .OrderByDescending(c => c.CreateDate)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync(cancellationToken);

                var campaignDtos = _mapper.Map<List<CampaignDto>>(campaigns);
                var paginatedResult = PaginatedResult<CampaignDto>.Create(campaignDtos, request.PageNumber, request.PageSize, totalCount);

                return BaseResponse<PaginatedResult<CampaignDto>>.Success(paginatedResult);
            }
            catch (Exception ex)
            {
                return BaseResponse<PaginatedResult<CampaignDto>>.Failure($"Error retrieving campaigns: {ex.Message}");
            }
        }
    }
}
