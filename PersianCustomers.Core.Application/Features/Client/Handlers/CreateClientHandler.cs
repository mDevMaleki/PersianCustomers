using AutoMapper;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.Commands;
using ClientEntity = PersianCustomers.Core.Domain.Entities.Client;
namespace PersianCustomers.Core.Application.Features.Client.Handlers
{
    public class CreateClientHandler : ICommandHandler<CreateClientCommand, BaseResponse<long>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        public CreateClientHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<long>> Handle(CreateClientCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var existingclient = await _unitOfWork.Clients.FindAsync(x=>x.MobileNumber1 == request.MobileNumber1);
                if (existingclient == null)
                    return BaseResponse<long>.Failure("این مشتری قبلا ثبت شده است");

                var client = _mapper.Map<ClientEntity>(request);

               
                var createdClient = await _unitOfWork.Clients.AddAsync(client);
                await _unitOfWork.SaveChangesAsync();

                return BaseResponse<long>.Success(createdClient.Id, "Client created successfully");
            }
            catch (Exception ex)
            {
                return BaseResponse<long>.Failure($"Error creating Client: {ex.Message}");
            }
        }
    }
}
