using System;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;

namespace PersianCustomers.Core.Application.Features.Campaign.Commands
{
    public class UpdateCampaignCommand : ICommand<BaseResponse<bool>>
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public string Type { get; set; } = "";
        public string Placement { get; set; } = "";
        public string Url { get; set; } = "";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Budget { get; set; }
        public string? Status { get; set; }
        public string? Description { get; set; }
    }
}
