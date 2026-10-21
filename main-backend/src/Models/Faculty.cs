using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("faculties")]
public class Faculty
{
    [Column("id")]
    public int Id { get; set; }

    [Column("organization_id")]
    public int OrganizationId { get; set; }

    [ForeignKey("OrganizationId")]
    public Organization? Organization { get; set; }

    [Column("company_id")]
    public int CompanyId { get; set; }

    [ForeignKey("CompanyId")]
    public Company? Company { get; set; }

    [Column("department_id")]
    public int DepartmentId { get; set; }

    [ForeignKey("DepartmentId")]
    public Department? Department { get; set; }

    [Column("sub_role_id")]
    public int SubRoleId { get; set; }

    [ForeignKey("SubRoleId")]
    public SystemSubRole? SubRole { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("photo_path")]
    public string? PhotoPath { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}