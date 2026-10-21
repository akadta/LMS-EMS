using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("courses")]
public class Course
{
    [Column("id")] public int Id { get; set; }
    [Column("organization_id")] public int OrganizationId { get; set; }
    [Column("company_id")] public int? CompanyId { get; set; }
    [Column("department_id")] public int? DepartmentId { get; set; }

    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("description")] public string? Description { get; set; }

    [Column("duration_value")] public int? DurationValue { get; set; }
    [Column("duration_unit")] public string? DurationUnit { get; set; } // day, week, month, year

    [Column("difficulty_level")] public string DifficultyLevel { get; set; } = "beginner"; // beginner, intermediate, advanced, expert

    [Column("is_final_assessment")] public bool IsFinalAssessment { get; set; }
    [Column("is_draft")] public bool IsDraft { get; set; } = true;
    [Column("is_active")] public bool IsActive { get; set; } = true;

    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CourseImage> Images { get; set; } = new List<CourseImage>();
    public ICollection<CourseCategoryMap> CategoryMaps { get; set; } = new List<CourseCategoryMap>();
    public ICollection<CourseModule> Modules { get; set; } = new List<CourseModule>();
}