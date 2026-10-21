using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("chapters")]
public class Chapter
{
    [Column("id")] public int Id { get; set; }
    [Column("module_id")] public int ModuleId { get; set; }
    [ForeignKey("ModuleId")] public CourseModule? Module { get; set; }

    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("description")] public string? Description { get; set; }

    [Column("is_final_assessment")] public bool IsFinalAssessment { get; set; }
    [Column("is_draft")] public bool IsDraft { get; set; } = true;
    [Column("sort_order")] public int SortOrder { get; set; }

    [Column("is_pass")] public bool IsPass { get; set; }
    [Column("is_review_unlock")] public bool IsReviewUnlock { get; set; }

    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ChapterMedia> Media { get; set; } = new List<ChapterMedia>();
}