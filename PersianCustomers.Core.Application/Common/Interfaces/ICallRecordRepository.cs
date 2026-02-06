using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PersianCustomers.Core.Domain.Entities;

namespace PersianCustomers.Core.Application.Common.Interfaces
{
    public interface ICallRecordRepository
    {
        Task<IQueryable<CallRecord>> GetCallsAsync(DateTime startDate, DateTime endDate, string phoneNumber);
    }
}
