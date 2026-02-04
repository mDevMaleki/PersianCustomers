using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PersianCustomers.EndPoints.WebApi.Middlewares
{
    public class PersianCustomerContextMiddleware
    {
        private readonly RequestDelegate _next;

        public PersianCustomerContextMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var identity = context.User.Identity as ClaimsIdentity;

         
                if (!context.User.HasClaim(c => c.Type == ClaimTypes.Role))
                {
                    var roleClaim = context.User.FindFirst(ClaimTypes.Role);
                    if (roleClaim != null)
                    {
                        identity?.AddClaim(new Claim(ClaimTypes.Role, roleClaim.Value));
                    }
                }

              
            }

            await _next(context);
        }

    }
}
