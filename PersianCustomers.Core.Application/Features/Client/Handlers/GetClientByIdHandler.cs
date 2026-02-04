using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.DTOs;
using PersianCustomers.Core.Application.Features.Client.Queries;

namespace PersianCustomers.Core.Application.Features.Client.Handlers
{
    public class GetClientByIdHandler : IQueryHandler<GetClientByIdQuery, BaseResponse<ClientDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GetClientByIdHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<ClientDto>> Handle(GetClientByIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var clients = await _unitOfWork.Clients.FindAsync(
                    c => c.Id == request.Id);

                var client = clients.FirstOrDefault();
                if (client == null)
                    return BaseResponse<ClientDto>.Failure("Client not found");

                var clientDto = _mapper.Map<ClientDto>(client);
                return BaseResponse<ClientDto>.Success(clientDto);
            }
            catch (Exception ex)
            {
                return BaseResponse<ClientDto>.Failure($"Error retrieving Client: {ex.Message}");
            }
        }
    }
}
