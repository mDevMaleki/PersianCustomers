using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.DTOs;
using PersianCustomers.Core.Application.Features.Viop.DTOs;

namespace PersianCustomers.Core.Application.Features.Client.Queries
{
    public record GetCallRecordByDateQuery(
        DateTime startDate ,
        DateTime endDate ,
        string phoneNumber,
        int PageNumber = 1,
    int PageSize = 10
    ) : IQuery<BaseResponse<PaginatedResult<CallRecordDto>>>;
}
