using Microsoft.AspNetCore.Http;
using PersianCustomers.Core.Application.Common.Interfaces;
using System.Security.Claims;

public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? GetUserId() =>
        _httpContextAccessor?.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

    public string? GetRole()
    {
        return _httpContextAccessor?.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);
    }

    public long? GetClubId()
    {
        var value = _httpContextAccessor?.HttpContext?.User?.FindFirstValue("clubId");
        return long.TryParse(value, out var id) ? id : null;
    }

    public long? GetBranchId()
    {
        var value = _httpContextAccessor?.HttpContext?.User?.FindFirstValue("branchId");
        return long.TryParse(value, out var id) ? id : null;
    }




}
