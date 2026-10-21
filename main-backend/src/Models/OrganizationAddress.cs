using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("organization_addresses")]
public class OrganizationAddress
{
    [Column("id")]
    public int Id { get; set; }

    [Column("organization_id")]
    public int OrganizationId { get; set; }

    [ForeignKey("OrganizationId")]
    public Organization? Organization { get; set; }

    [Column("line")]
    public string Line { get; set; } = string.Empty;

    [Column("sort_order")]
    public int SortOrder { get; set; }
}