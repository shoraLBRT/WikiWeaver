using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WikiWeaver.Application.Configuration;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Resources;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Application.Services;

public class AdminAuthService
{
    private readonly WikiWeaverDbContext _dbContext;
    private readonly AuthOptions _authOptions;
    private readonly PasswordHasher<AdminUser> _passwordHasher = new();

    public AdminAuthService(WikiWeaverDbContext dbContext, IOptions<AuthOptions> authOptions)
    {
        _dbContext = dbContext;
        _authOptions = authOptions.Value;
    }

    public async Task<AdminAuthStatusDto> GetAuthStatusAsync(CancellationToken cancellationToken = default)
    {
        var hasAdmins = await _dbContext.AdminUsers.AnyAsync(cancellationToken);
        return new AdminAuthStatusDto { RequiresBootstrapAdmin = !hasAdmins };
    }

    public async Task<AdminService.ServiceResult<AdminAuthResponseDto>> RegisterAsync(
        AdminRegisterRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            return AdminService.ServiceResult<AdminAuthResponseDto>.Failure(AuthMessages.EmailAndPasswordRequired);
        }

        var alreadyExists = await _dbContext.AdminUsers.AnyAsync(admin => admin.Email == normalizedEmail, cancellationToken);
        if (alreadyExists)
        {
            return AdminService.ServiceResult<AdminAuthResponseDto>.Failure(AuthMessages.AdminAlreadyExists);
        }

        var hasAdmins = await _dbContext.AdminUsers.AnyAsync(cancellationToken);
        AdminInviteToken? inviteToken = null;
        if (hasAdmins)
        {
            inviteToken = await ValidateInviteTokenAsync(request.InviteToken, cancellationToken);
            if (inviteToken is null)
            {
                return AdminService.ServiceResult<AdminAuthResponseDto>.Failure(AuthMessages.InviteTokenInvalid);
            }
        }

        var admin = new AdminUser { Email = normalizedEmail };
        admin.PasswordHash = _passwordHasher.HashPassword(admin, request.Password);
        _dbContext.AdminUsers.Add(admin);

        if (inviteToken is not null)
        {
            inviteToken.UsedAtUtc = DateTime.UtcNow;
            inviteToken.UsedByAdmin = admin;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return AdminService.ServiceResult<AdminAuthResponseDto>.Success(CreateAuthResponse(admin));
    }

    public async Task<AdminService.ServiceResult<AdminAuthResponseDto>> LoginAsync(
        AdminLoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            return AdminService.ServiceResult<AdminAuthResponseDto>.Failure(AuthMessages.EmailAndPasswordRequired);
        }

        var admin = await _dbContext.AdminUsers.FirstOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);
        if (admin is null)
        {
            return AdminService.ServiceResult<AdminAuthResponseDto>.Failure(AuthMessages.InvalidCredentials);
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(admin, admin.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return AdminService.ServiceResult<AdminAuthResponseDto>.Failure(AuthMessages.InvalidCredentials);
        }

        return AdminService.ServiceResult<AdminAuthResponseDto>.Success(CreateAuthResponse(admin));
    }

    public async Task<AdminService.ServiceResult<AdminInviteTokenCreateResponseDto>> GenerateInviteTokenAsync(
        int createdByAdminId,
        CancellationToken cancellationToken = default)
    {
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var inviteToken = new AdminInviteToken
        {
            TokenHash = HashToken(rawToken),
            ExpiresAtUtc = DateTime.UtcNow.AddHours(_authOptions.InviteTokenLifetimeHours),
            CreatedByAdminId = createdByAdminId,
        };

        _dbContext.AdminInviteTokens.Add(inviteToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return AdminService.ServiceResult<AdminInviteTokenCreateResponseDto>.Success(new AdminInviteTokenCreateResponseDto
        {
            Token = rawToken,
            ExpiresAtUtc = inviteToken.ExpiresAtUtc,
        });
    }

    private async Task<AdminInviteToken?> ValidateInviteTokenAsync(string? rawToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return null;
        }

        var tokenHash = HashToken(rawToken.Trim());
        var nowUtc = DateTime.UtcNow;

        return await _dbContext.AdminInviteTokens
            .FirstOrDefaultAsync(token =>
                token.TokenHash == tokenHash
                && token.UsedAtUtc == null
                && token.ExpiresAtUtc > nowUtc,
                cancellationToken);
    }

    private AdminAuthResponseDto CreateAuthResponse(AdminUser admin)
    {
        if (string.IsNullOrWhiteSpace(_authOptions.JwtSigningKey))
        {
            throw new InvalidOperationException(AuthMessages.SigningKeyMissing);
        }

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_authOptions.AccessTokenLifetimeMinutes);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
                new Claim(ClaimTypes.Email, admin.Email),
                new Claim(ClaimTypes.Role, "Admin"),
            }),
            Expires = expiresAtUtc,
            Issuer = _authOptions.JwtIssuer,
            Audience = _authOptions.JwtAudience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authOptions.JwtSigningKey)),
                SecurityAlgorithms.HmacSha256Signature),
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return new AdminAuthResponseDto
        {
            AccessToken = tokenHandler.WriteToken(token),
            ExpiresAtUtc = expiresAtUtc,
            Email = admin.Email,
        };
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }
}
