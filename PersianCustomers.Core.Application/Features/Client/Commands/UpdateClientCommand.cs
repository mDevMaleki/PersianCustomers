

using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;

namespace PersianCustomers.Core.Application.Features.Client.Commands;

public record UpdateClientCommand
    ( long Id,
      string? FirstName,
      string? LastName,
      string Title,
      DateTime? BirthDay,
      int DentalService,
      string? Description,
      string? Email,
      string? PhoneNumber,
      string MobileNumber1,
      string? MobileNumber2,
      string? Address,
      string? Province,
      string? City,
      string? PostalCode,
      string? Country )
    : ICommand<BaseResponse<bool>>;