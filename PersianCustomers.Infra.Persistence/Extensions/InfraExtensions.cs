using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Infra.Persistence.Context;
using PersianCustomers.Infra.Persistence.Repositories;


namespace PersianCustomers.Infra.Persistence.Extensions;

public static class InfraExtensions
{
    public static IServiceCollection AddDatabaseServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            
            // Enable sensitive data logging in development
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                options.EnableSensitiveDataLogging();
            }
            
            // Enable detailed errors
            options.EnableDetailedErrors();
           
           
        });

        services.AddHttpContextAccessor();
        services.AddScoped<IUserContextService, UserContextService>();
        
        // Repository registration
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepositoryAdvanced<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
       
    
        // Service registration
       
        
      

        return services;
    }

    public static IServiceCollection AddCachingServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Memory Cache
        services.AddMemoryCache(options =>
        {
            options.SizeLimit = 1000; // Limit memory cache entries
            options.CompactionPercentage = 0.25; // Compact 25% when limit reached
        });

        // Distributed Cache (Redis)
        // var redisConnectionString = configuration.GetConnectionString("Redis");
        // if (!string.IsNullOrEmpty(redisConnectionString))
        // {
        //     services.AddStackExchangeRedisCache(options =>
        //     {
        //         options.Configuration = redisConnectionString;
        //         options.InstanceName = "SajedClub";
        //     });
        // }
        // else
        // {
            // Fallback to in-memory distributed cache for development
            services.AddDistributedMemoryCache();
        // }

        return services;
    }

  
    public static IServiceCollection AddEnhancedServices(this IServiceCollection services, IConfiguration configuration)
    {
       
        // Add CORS for API access
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
        });

      

        return services;
    }
}
