using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.DTOs;
using PersianCustomers.Core.Application.Features.Client.Queries;
using PersianCustomers.Core.Application.Features.Viop.DTOs;
using PersianCustomers.Core.Domain.Entities;

namespace PersianCustomers.Core.Application.Features.Client.Handlers
{
    public class GetCallRecordByDateHandler : IQueryHandler<GetCallRecordByDateQuery, BaseResponse<PaginatedResult<CallRecordDto>>>
    {
        private readonly ICallRecordRepository _callRecordRepository;
        private readonly IMapper _mapper;

        public GetCallRecordByDateHandler( IMapper mapper, ICallRecordRepository callRecordRepository)
        {
            _mapper = mapper;
            _callRecordRepository = callRecordRepository;
        }

        public async Task<BaseResponse<PaginatedResult<CallRecordDto>>> Handle(GetCallRecordByDateQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var callRecorsQuery = await _callRecordRepository.GetCallsAsync(request.startDate,request.endDate,request.phoneNumber);


                var totalCount = await callRecorsQuery.CountAsync(cancellationToken);

                var callRecors = await callRecorsQuery
                    .OrderBy(c => c.CallDate)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync(cancellationToken);

                if (callRecors == null)
                    return BaseResponse<PaginatedResult<CallRecordDto>>.Failure("Client not found");
              

                var callRecorsList = _mapper.Map<List<CallRecordDto>>(callRecors);

                var paginatedResult = PaginatedResult<CallRecordDto>.Create(callRecorsList, request.PageNumber, request.PageSize, totalCount);

                return BaseResponse<PaginatedResult<CallRecordDto>>.Success(paginatedResult);
            }
            catch (Exception ex)
            {
                return BaseResponse<PaginatedResult<CallRecordDto>>.Failure($"Error retrieving Client: {ex.Message}");
            }
        }
    }
}
