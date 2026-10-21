using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("organization_categories")]
public class OrganizationCategory
{
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("slug")]
    public string Slug { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrganizationCategoryMap> CategoryMaps { get; set; } = new List<OrganizationCategoryMap>();
}