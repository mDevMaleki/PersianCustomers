using System;

namespace PersianCustomers.Core.Application.Features.Viop.DTOs
{
    public class CallRecordDto
    {
     
        public string Clid { get; set; } // شناسه تماس‌گیرنده
        public string Src { get; set; } // شماره تماس‌گیرنده
        public string Dst { get; set; } // شماره مقصد
        public string Dcontext { get; set; } // کانتکست تماس
        public string Channel { get; set; } // کانال تماس
        public string DstChannel { get; set; } // کانال مقصد
        public string LastApp { get; set; } // آخرین اپلیکیشن مدیریت‌کننده تماس
        public string LastData { get; set; } // داده‌های مربوط به آخرین اپلیکیشن
        public DateTime CallDate { get; set; } // تاریخ و زمان تماس
        public int Duration { get; set; } // مدت زمان تماس به ثانیه
        public int BillSec { get; set; } // مدت زمان billable تماس
        public string Disposition { get; set; } // وضعیت تماس (مثلاً ANSWERED یا CONGESTION)
        public int AmaFlags { get; set; } // پرچم‌های AMA
        public string AccountCode { get; set; } // کد حساب
        public string UniqueId { get; set; } // شناسه یکتای تماس
        public string UserField { get; set; } // فیلد اضافی
        public string Did { get; set; } // DID تماس
        public string RecordingFile { get; set; } // فایل ضبط تماس
        public string Cnum { get; set; } // شماره تماس
        public string Cnam { get; set; } // نام تماس‌گیرنده
        public string OutboundCnum { get; set; } // شماره تماس outbound
        public string OutboundCnam { get; set; } // نام تماس‌گیرنده outbound
        public string DstCnam { get; set; } // نام تماس مقصد
        public string LinkedId { get; set; } // شناسه لینک شده
        public string PeerAccount { get; set; } // حساب همتای تماس
        public int Sequence { get; set; } // توالی تماس‌ها
    }
}
