using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.Commands;

namespace PersianCustomers.Core.Application.Features.Client.Handlers;

public class DeleteClientHandler : ICommandHandler<DeleteClientCommand, BaseResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteClientHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<BaseResponse<bool>> Handle(DeleteClientCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _unitOfWork.Clients.DeleteAsync(request.Id);
            if (!deleted)
            {
                return BaseResponse<bool>.Failure("client not found");
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return BaseResponse<bool>.Success(true, "client deleted successfully");
        }
        catch (Exception ex)
        {
            return BaseResponse<bool>.Failure($"Error deleting client: {ex.Message}");
        }
    }
}
