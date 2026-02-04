using Microsoft.EntityFrameworkCore;
using AutoMapper;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.DTOs;
using PersianCustomers.Core.Application.Features.Client.Queries;

namespace PersianCustomers.Core.Application.Features.Client.Handlers
{
    public class GetAllClientsHandler : IQueryHandler<GetAllClientsQuery, BaseResponse<PaginatedResult<ClientDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GetAllClientsHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<BaseResponse<PaginatedResult<ClientDto>>> Handle(GetAllClientsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var clientsQuery = await _unitOfWork.Clients.GetAllQueryableAsync();



                if (!string.IsNullOrEmpty(request.SearchTerm))
                {
                    var searchTerm = request.SearchTerm.ToLower();
                    clientsQuery = clientsQuery.Where(c => c.FirstName.ToLower().Contains(searchTerm));
                }

                var totalCount = await clientsQuery.CountAsync(cancellationToken);

                var clients = await clientsQuery
                    .OrderBy(c => c.LastName)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync(cancellationToken);

                var clientDtos = _mapper.Map<List<ClientDto>>(clients);
                var paginatedResult = PaginatedResult<ClientDto>.Create(clientDtos, request.PageNumber, request.PageSize, totalCount);

                return BaseResponse<PaginatedResult<ClientDto>>.Success(paginatedResult);
            }
            catch (Exception ex)
            {
                return BaseResponse<PaginatedResult<ClientDto>>.Failure($"Error retrieving clients: {ex.Message}");
            }
        }
    }
}
