namespace WikiWeaver.Domain.Entities;

public class AdminInviteToken
{
    public int Id { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime? UsedAtUtc { get; set; }

    public int CreatedByAdminId { get; set; }

    public AdminUser CreatedByAdmin { get; set; } = null!;

    public int? UsedByAdminId { get; set; }

    public AdminUser? UsedByAdmin { get; set; }

    public bool IsUsed => UsedAtUtc.HasValue;
}
