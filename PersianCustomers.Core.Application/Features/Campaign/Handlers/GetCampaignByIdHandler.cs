using AutoMapper;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Campaign.DTOs;
using PersianCustomers.Core.Application.Features.Campaign.Queries;

namespace PersianCustomers.Core.Application.Features.Campaign.Handlers
{
    public class GetCampaignByIdHandler : IQueryHandler<GetCampaignByIdQuery, BaseResponse<CampaignDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GetCampaignByIdHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<CampaignDto>> Handle(GetCampaignByIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var campaign = await _unitOfWork.Campaigns.GetByIdAsync(request.Id, cancellationToken);
                if (campaign == null)
                {
                    return BaseResponse<CampaignDto>.Failure("Campaign not found");
                }

                var dto = _mapper.Map<CampaignDto>(campaign);
                return BaseResponse<CampaignDto>.Success(dto);
            }
            catch (Exception ex)
            {
                return BaseResponse<CampaignDto>.Failure($"Error retrieving campaign: {ex.Message}");
            }
        }
    }
}
