using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("course_categories")]
public class CourseCategory
{
    [Column("id")] public int Id { get; set; }
    [Column("organization_id")] public int OrganizationId { get; set; }
    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CourseCategoryMap> CategoryMaps { get; set; } = new List<CourseCategoryMap>();
}