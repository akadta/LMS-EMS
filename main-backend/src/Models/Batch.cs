using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("batches")]
public class Batch
{
    [Column("id")] public int Id { get; set; }
    [Column("organization_id")] public int OrganizationId { get; set; }
    [Column("company_id")] public int? CompanyId { get; set; }
    [Column("department_id")] public int? DepartmentId { get; set; }

    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("description")] public string? Description { get; set; }
    [Column("is_active")] public bool IsActive { get; set; } = true;

    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BatchStudent> Students { get; set; } = new List<BatchStudent>();
    public ICollection<BatchCourse> Courses { get; set; } = new List<BatchCourse>();
}