using PersianCustomers.Core.Domain.Entities;
using System.Security.Claims;

namespace PersianCustomers.Core.Application.Features.Auth.Interfaces;

public interface IJwtService
{
    Task<string> GenerateAccessTokenAsync(ApplicationUser user);
    string GenerateRefreshToken();
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
    Task<bool> ValidateTokenAsync(string token);
}