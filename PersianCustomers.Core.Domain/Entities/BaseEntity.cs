using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PersianCustomers.Core.Domain.Entities
{
    public class BaseEntity
    {
        public long Id { get; set; }

        public DateTime CreateDate { get; set; }

        public long CreateAt { get; set; }

        public DateTime? UpdateDate { get; set; }

        public long? UpdateAt { get; set; }

    }
}
