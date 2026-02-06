using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PersianCustomers.Core.Domain.Entities
{
    [Table("cdr")] // نام جدول در پایگاه داده
    public class CallRecord
    {
 
        [Column("clid")]
        public string Clid { get; set; }

        [Column("src")]
        public string Src { get; set; }

        [Column("dst")]
        public string Dst { get; set; }

        [Column("dcontext")]
        public string Dcontext { get; set; }

        [Column("channel")]
        public string Channel { get; set; }

        [Column("dstchannel")]
        public string DstChannel { get; set; }

        [Column("lastapp")]
        public string LastApp { get; set; }

        [Column("lastdata")]
        public string LastData { get; set; }

        [Column("calldate")]
        public DateTime CallDate { get; set; }

        [Column("duration")]
        public int Duration { get; set; }

        [Column("billsec")]
        public int BillSec { get; set; }

        [Column("disposition")]
        public string Disposition { get; set; }

        [Column("amaflags")]
        public int AmaFlags { get; set; }

        [Column("accountcode")]
        public string AccountCode { get; set; }

        [Column("uniqueid")]
        public string UniqueId { get; set; }

        [Column("userfield")]
        public string UserField { get; set; }

        [Column("did")]
        public string Did { get; set; }

        [Column("recordingfile")]
        public string RecordingFile { get; set; }

        [Column("cnum")]
        public string Cnum { get; set; }

        [Column("cnam")]
        public string Cnam { get; set; }

        [Column("outbound_cnum")]
        public string OutboundCnum { get; set; }

        [Column("outbound_cnam")]
        public string OutboundCnam { get; set; }

        [Column("dst_cnam")]
        public string DstCnam { get; set; }

        [Column("linkedid")]
        public string LinkedId { get; set; }

        [Column("peeraccount")]
        public string PeerAccount { get; set; }

        [Column("sequence")]
        public int Sequence { get; set; }
    }
}
