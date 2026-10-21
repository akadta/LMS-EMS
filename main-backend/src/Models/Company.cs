using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("companies")]
public class Company
{
    [Column("id")]
    public int Id { get; set; }

    [Column("organization_id")]
    public int OrganizationId { get; set; }

    [ForeignKey("OrganizationId")]
    public Organization? Organization { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("admin_name")]
    public string AdminName { get; set; } = string.Empty;

    [Column("logo_path")]
    public string? LogoPath { get; set; }

    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("place")]
    public string? Place { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Department> Departments { get; set; } = new List<Department>();

}