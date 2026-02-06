using Microsoft.EntityFrameworkCore;
using PersianCustomers.Core.Domain.Entities;

namespace PersianCustomers.Infra.Persistence.Context
{
    public class AsteriskDbContext : DbContext
    {
        public AsteriskDbContext(DbContextOptions<AsteriskDbContext> options)
            : base(options)
        { }

        public DbSet<CallRecord> CallRecords { get; set; }


        

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CallRecord>()
               .HasNoKey();  // بدون کلید اصلی

            // پیکربندی نام جدول
            modelBuilder.Entity<CallRecord>()
                .ToTable("cdr"); // جدول `cdr` در پایگاه داده

            // پیکربندی نام فیلدها
            modelBuilder.Entity<CallRecord>()
                .Property(c => c.CallDate)
                .HasColumnName("calldate");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Clid)
                .HasColumnName("clid");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Src)
                .HasColumnName("src");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Dst)
                .HasColumnName("dst");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Dcontext)
                .HasColumnName("dcontext");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Channel)
                .HasColumnName("channel");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.DstChannel)
                .HasColumnName("dstchannel");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.LastApp)
                .HasColumnName("lastapp");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.LastData)
                .HasColumnName("lastdata");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Duration)
                .HasColumnName("duration");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.BillSec)
                .HasColumnName("billsec");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Disposition)
                .HasColumnName("disposition");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.AmaFlags)
                .HasColumnName("amaflags");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.AccountCode)
                .HasColumnName("accountcode");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.UniqueId)
                .HasColumnName("uniqueid");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.UserField)
                .HasColumnName("userfield");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Did)
                .HasColumnName("did");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.RecordingFile)
                .HasColumnName("recordingfile");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Cnum)
                .HasColumnName("cnum");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Cnam)
                .HasColumnName("cnam");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.OutboundCnum)
                .HasColumnName("outbound_cnum");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.OutboundCnam)
                .HasColumnName("outbound_cnam");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.DstCnam)
                .HasColumnName("dst_cnam");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.LinkedId)
                .HasColumnName("linkedid");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.PeerAccount)
                .HasColumnName("peeraccount");

            modelBuilder.Entity<CallRecord>()
                .Property(c => c.Sequence)
                .HasColumnName("sequence");
        }
    }
}
