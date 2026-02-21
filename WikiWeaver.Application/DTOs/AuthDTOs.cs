namespace WikiWeaver.Application.DTOs;

public class AdminAuthStatusDto
{
    public bool RequiresBootstrapAdmin { get; set; }
}

public class AdminRegisterRequestDto
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string? InviteToken { get; set; }
}

public class AdminLoginRequestDto
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class AdminAuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public string Email { get; set; } = string.Empty;
}

public class AdminInviteTokenCreateResponseDto
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }
}
