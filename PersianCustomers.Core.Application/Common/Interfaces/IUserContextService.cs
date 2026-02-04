using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PersianCustomers.Core.Application.Common.Interfaces
{
    public interface IUserContextService
    {
        string? GetUserId();
        string? GetRole();
        long? GetClubId();
        long? GetBranchId();
      
    }
}
