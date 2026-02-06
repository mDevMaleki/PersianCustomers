using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Domain.Entities;
using PersianCustomers.Infra.Persistence.Context;

namespace PersianCustomers.Infra.Persistence.Repositories
{
    public class CallRecordRepository : ICallRecordRepository
    {
        private readonly AsteriskDbContext _context;

        public CallRecordRepository(AsteriskDbContext context)
        {
            _context = context;
        }

        public async Task<IQueryable<CallRecord>> GetCallsAsync(DateTime startDate, DateTime endDate, string phoneNumber)
        {
            return _context.CallRecords
                .Where(c =>
                    (EF.Functions.Like(c.Src, "%" + phoneNumber + "%") || EF.Functions.Like(c.Dst, "%" + phoneNumber + "%")) &&
                    c.CallDate >= startDate.Date && // مقایسه تاریخ به‌صورت دقیق
                    c.CallDate <= endDate.Date.AddDays(1).AddSeconds(-1)); // شامل کردن کامل روز آخر
        }


        //public async Task<CallRecord> GetCallAsync(string uniqueId)
        //{
        //    return await _context.CallRecords.FirstOrDefaultAsync(x => x.UniqueId == uniqueId);
                    
        //}






    }
}
