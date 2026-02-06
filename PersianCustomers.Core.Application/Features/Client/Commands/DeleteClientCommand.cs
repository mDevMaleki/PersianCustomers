using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;

namespace PersianCustomers.Core.Application.Features.Client.Commands;

public record DeleteClientCommand(long Id) : ICommand<BaseResponse<bool>>;
