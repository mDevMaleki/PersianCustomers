using AutoMapper;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Campaign.Commands;

namespace PersianCustomers.Core.Application.Features.Campaign.Handlers
{
    public class UpdateCampaignHandler : ICommandHandler<UpdateCampaignCommand, BaseResponse<bool>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdateCampaignHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<bool>> Handle(UpdateCampaignCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var campaign = await _unitOfWork.Campaigns.GetByIdAsync(request.Id, cancellationToken);
                if (campaign == null)
                {
                    return BaseResponse<bool>.Failure("campaign not found");
                }

                _mapper.Map(request, campaign);

                await _unitOfWork.Campaigns.UpdateAsync(campaign);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                return BaseResponse<bool>.Success(true, "Campaign updated successfully");
            }
            catch (Exception ex)
            {
                return BaseResponse<bool>.Failure($"Error updating campaign: {ex.Message}");
            }
        }
    }
}
