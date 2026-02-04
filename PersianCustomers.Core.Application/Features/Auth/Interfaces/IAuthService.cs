using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Application.Features.Auth.DTOs;


namespace PersianCustomers.Core.Application.Features.Auth.Interfaces;

public interface IAuthService
{
    Task<BaseResponse<AuthResponse>> LoginAsync(LoginRequest request);
    Task<BaseResponse<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<BaseResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<BaseResponse<bool>> LogoutAsync(string userId);
    Task<BaseResponse<bool>> RevokeTokenAsync(string userId, string refreshToken);
}