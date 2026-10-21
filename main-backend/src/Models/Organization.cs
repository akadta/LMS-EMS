using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("organizations")]
public class Organization
{
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [Column("logo_path")]
    public string? LogoPath { get; set; }

    // Accent color — used for buttons, active states, highlights
    [Column("theme_color")]
    public string? ThemeColor { get; set; } = "#6366f1";

    // Sidebar background color
    [Column("sidebar_color")]
    public string? SidebarColor { get; set; } = "#0e1220";

    // Header/top bar background color
    [Column("header_color")]
    public string? HeaderColor { get; set; } = "#0a0d16";

    [Column("is_lms")]
    public bool IsLms { get; set; }

    [Column("is_ems")]
    public bool IsEms { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrganizationAddress> Addresses { get; set; } = new List<OrganizationAddress>();
    public ICollection<OrganizationCategoryMap> CategoryMaps { get; set; } = new List<OrganizationCategoryMap>();

    public ICollection<Company> Companies { get; set; } = new List<Company>();

}