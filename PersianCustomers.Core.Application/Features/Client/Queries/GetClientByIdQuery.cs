using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.DTOs;

namespace PersianCustomers.Core.Application.Features.Client.Queries
{
    public record GetClientByIdQuery(long Id) : IQuery<BaseResponse<ClientDto>>;
}
