using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("organization_category_map")]
public class OrganizationCategoryMap
{
    [Column("id")]
    public int Id { get; set; }

    [Column("organization_id")]
    public int OrganizationId { get; set; }

    [ForeignKey("OrganizationId")]
    public Organization? Organization { get; set; }

    [Column("organization_category_id")]
    public int OrganizationCategoryId { get; set; }

    [ForeignKey("OrganizationCategoryId")]
    public OrganizationCategory? Category { get; set; }
}