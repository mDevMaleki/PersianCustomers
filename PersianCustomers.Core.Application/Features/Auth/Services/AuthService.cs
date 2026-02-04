using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

using System.Security.Claims;
using PersianCustomers.Core.Application.Features.Auth.DTOs;
using PersianCustomers.Core.Application.Features.Auth.Interfaces;
using PersianCustomers.Core.Domain.Entities;
using PersianCustomers.Core.Application.Common.Models;

namespace PersianCustomers.Core.Application.Features.Auth.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly JwtSettings _jwtSettings;
    private readonly IMapper _mapper;
  

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IJwtService jwtService,
        IOptions<JwtSettings> jwtSettings,
        IMapper mapper)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _jwtSettings = jwtSettings.Value;
        _mapper = mapper;
       
    }

    public async Task<BaseResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
                return BaseResponse<AuthResponse>.Failure("Invalid email or password");

            var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
                return BaseResponse<AuthResponse>.Failure("Invalid email or password");

            var accessToken = await _jwtService.GenerateAccessTokenAsync(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDurationInDays);
            await _userManager.UpdateAsync(user);

            var roles = await _userManager.GetRolesAsync(user);

            var authResponse = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpirationDate = DateTime.UtcNow.AddMinutes(_jwtSettings.DurationInMinutes),
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Roles = roles.ToList()
                }
            };

            return BaseResponse<AuthResponse>.Success(authResponse, "Login successful");
        }
        catch (Exception ex)
        {
            return BaseResponse<AuthResponse>.Failure($"Login failed: {ex.Message}");
        }
    }

    public async Task<BaseResponse<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return BaseResponse<AuthResponse>.Failure("Email already exists");

            // Validate branch if provided
          

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                NationalCode = request.NationalCode,
                BirthDate = request.BirthDate,
                Address = request.Address,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                return BaseResponse<AuthResponse>.Failure(string.Join(", ", result.Errors.Select(e => e.Description)));

            // Add default role
            await _userManager.AddToRoleAsync(user, "User");

            var accessToken = await _jwtService.GenerateAccessTokenAsync(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDurationInDays);
            await _userManager.UpdateAsync(user);

            var authResponse = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpirationDate = DateTime.UtcNow.AddMinutes(_jwtSettings.DurationInMinutes),
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Roles = new List<string> { "User" }
                }
            };

            return BaseResponse<AuthResponse>.Success(authResponse, "Registration successful");
        }
        catch (Exception ex)
        {
            return BaseResponse<AuthResponse>.Failure($"Registration failed: {ex.Message}");
        }
    }

    public async Task<BaseResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        try
        {
            var principal = _jwtService.GetPrincipalFromExpiredToken(request.AccessToken);
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return BaseResponse<AuthResponse>.Failure("Invalid token");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                return BaseResponse<AuthResponse>.Failure("Invalid refresh token");

            var accessToken = await _jwtService.GenerateAccessTokenAsync(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDurationInDays);
            await _userManager.UpdateAsync(user);

            var roles = await _userManager.GetRolesAsync(user);
           

            var authResponse = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpirationDate = DateTime.UtcNow.AddMinutes(_jwtSettings.DurationInMinutes),
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                 
                    Roles = roles.ToList()
                }
            };

            return BaseResponse<AuthResponse>.Success(authResponse, "Token refreshed successfully");
        }
        catch (Exception ex)
        {
            return BaseResponse<AuthResponse>.Failure($"Token refresh failed: {ex.Message}");
        }
    }

    public async Task<BaseResponse<bool>> LogoutAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return BaseResponse<bool>.Failure("User not found");

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            return BaseResponse<bool>.Success(true, "Logout successful");
        }
        catch (Exception ex)
        {
            return BaseResponse<bool>.Failure($"Logout failed: {ex.Message}");
        }
    }

    public async Task<BaseResponse<bool>> RevokeTokenAsync(string userId, string refreshToken)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || user.RefreshToken != refreshToken)
                return BaseResponse<bool>.Failure("Invalid token");

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            return BaseResponse<bool>.Success(true, "Token revoked successfully");
        }
        catch (Exception ex)
        {
            return BaseResponse<bool>.Failure($"Token revocation failed: {ex.Message}");
        }
    }
}