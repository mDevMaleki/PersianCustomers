using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Client.DTOs;
using PersianCustomers.Core.Domain.Entities;

namespace PersianCustomers.Core.Application.Features.Client.Commands
{
    public class CreateClientCommand : ICommand<BaseResponse<long>>
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string Title { get; set; } = "";
        public DateTime? BirthDay { get; set; }
        public DentalServices DentalService { get; set; }
        public string? Description { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string MobileNumber1 { get; set; } = "";
        public string? MobileNumber2 { get; set; }
        public string? Address { get; set; }
        public string? Province { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }

    }
}
