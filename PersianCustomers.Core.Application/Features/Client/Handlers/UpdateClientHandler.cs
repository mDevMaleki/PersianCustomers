using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.Commands;
using ClientEntity =  PersianCustomers.Core.Domain.Entities.Client;

namespace PersianCustomers.Core.Application.Features.Client.Handlers
{
    public class UpdateClientHandler : ICommandHandler<UpdateClientCommand, BaseResponse<bool>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdateClientHandler(IUnitOfWork unitOfWork,IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<bool>> Handle(UpdateClientCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var client = await _unitOfWork.Clients.GetByIdAsync(request.Id);
                if (client == null)
                    return BaseResponse<bool>.Failure("client not found");

                var existingclientWithSameName = await _unitOfWork.Clients.FindAsync(c =>
                    (c.MobileNumber1 == request.MobileNumber1 ||
                     c.MobileNumber1 == request.MobileNumber2 ||
                     c.MobileNumber2 == request.MobileNumber1 ||
                     c.MobileNumber2 == request.MobileNumber2) &&
                    c.Id != request.Id);

                if (existingclientWithSameName.Any())
                    return BaseResponse<bool>.Failure("Another client with this name already exists");

                // Map INTO the existing tracked entity
                _mapper.Map(request, client);

                await _unitOfWork.Clients.UpdateAsync(client); // often not even needed if already tracked
                await _unitOfWork.SaveChangesAsync();

                return BaseResponse<bool>.Success(true, "client updated successfully");
            }
            catch (Exception ex)
            {
                return BaseResponse<bool>.Failure($"Error updating client: {ex.Message}");
            }
        }

    }
}
