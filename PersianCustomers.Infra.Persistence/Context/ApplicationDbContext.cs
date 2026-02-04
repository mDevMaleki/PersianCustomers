using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PersianCustomers.Core.Domain.Entities;

namespace PersianCustomers.Infra.Persistence.Context
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Client> Clients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // IMPORTANT: this configures Identity tables + keys
            base.OnModelCreating(modelBuilder);

            // Your custom configurations go here (optional)
            // modelBuilder.Entity<Client>(...);
        }
    }
}
