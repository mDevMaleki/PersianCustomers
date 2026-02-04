using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;


using PersianCustomers.Core.Application.Common.Mappings;

namespace PersianCustomers.Core.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(assembly));

        services.AddAutoMapper(_ => { }, typeof(MappingProfile).Assembly);

        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}
