using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Campaign.Commands;

namespace PersianCustomers.Core.Application.Features.Campaign.Handlers
{
    public class DeleteCampaignHandler : ICommandHandler<DeleteCampaignCommand, BaseResponse<bool>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteCampaignHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<BaseResponse<bool>> Handle(DeleteCampaignCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var deleted = await _unitOfWork.Campaigns.DeleteAsync(request.Id);
                if (!deleted)
                {
                    return BaseResponse<bool>.Failure("campaign not found");
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return BaseResponse<bool>.Success(true, "Campaign deleted successfully");
            }
            catch (Exception ex)
            {
                return BaseResponse<bool>.Failure($"Error deleting campaign: {ex.Message}");
            }
        }
    }
}
