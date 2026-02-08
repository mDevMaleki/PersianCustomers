using AutoMapper;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Campaign.Commands;
using CampaignEntity = PersianCustomers.Core.Domain.Entities.Campaign;

namespace PersianCustomers.Core.Application.Features.Campaign.Handlers
{
    public class CreateCampaignHandler : ICommandHandler<CreateCampaignCommand, BaseResponse<long>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateCampaignHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<long>> Handle(CreateCampaignCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var campaign = _mapper.Map<CampaignEntity>(request);

                var createdCampaign = await _unitOfWork.Campaigns.AddAsync(campaign, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                return BaseResponse<long>.Success(createdCampaign.Id, "Campaign created successfully");
            }
            catch (Exception ex)
            {
                return BaseResponse<long>.Failure($"Error creating campaign: {ex.Message}");
            }
        }
    }
}
