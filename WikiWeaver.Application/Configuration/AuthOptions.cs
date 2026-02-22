namespace WikiWeaver.Application.Configuration;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string JwtIssuer { get; set; } = "WikiWeaver";

    public string JwtAudience { get; set; } = "WikiWeaver.Admin";

    public string JwtSigningKey { get; set; } = string.Empty;

    public int AccessTokenLifetimeMinutes { get; set; } = 720;

    public int InviteTokenLifetimeHours { get; set; } = 24;
}
