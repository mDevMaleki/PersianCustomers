using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.DTOs;

namespace PersianCustomers.Core.Application.Features.Client.Queries;

public record GetAllClientsQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null
) : IQuery<BaseResponse<PaginatedResult<ClientDto>>>;