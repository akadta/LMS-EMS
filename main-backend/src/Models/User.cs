using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("users")]
public class User
{
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [Column("password")]
    public string Password { get; set; } = string.Empty;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("role_id")]
    public int? RoleId { get; set; }

    [ForeignKey("RoleId")]
    public Role? Role { get; set; }

    [Column("system_role_id")]
    public int? SystemRoleId { get; set; }

    [ForeignKey("SystemRoleId")]
    public SystemRole? SystemRole { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}