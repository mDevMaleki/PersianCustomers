using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using PersianCustomers.Core.Application.Features.Client.Commands;
using PersianCustomers.Core.Application.Features.Client.DTOs;
using PersianCustomers.Core.Application.Features.Viop.DTOs;
using PersianCustomers.Core.Domain.Entities;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace PersianCustomers.Core.Application.Common.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Client, ClientDto>();
            CreateMap<CallRecord, CallRecordDto>();
            CreateMap<CreateClientCommand, Client>().ReverseMap();
            CreateMap<UpdateClientCommand, Client>().ForMember(d => d.Id, opt => opt.Ignore()); 

        }
    }

}
