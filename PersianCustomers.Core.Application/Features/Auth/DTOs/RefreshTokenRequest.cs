using System.ComponentModel.DataAnnotations;

namespace PersianCustomers.Core.Application.Features.Auth.DTOs;

public class RefreshTokenRequest
{
    [Required]
    public string AccessToken { get; set; } = string.Empty;
    
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}