using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("modules")]
public class CourseModule
{
    [Column("id")] public int Id { get; set; }
    [Column("course_id")] public int CourseId { get; set; }
    [ForeignKey("CourseId")] public Course? Course { get; set; }

    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("description")] public string? Description { get; set; }
    [Column("image_path")] public string? ImagePath { get; set; }

    [Column("difficulty_level")] public string DifficultyLevel { get; set; } = "beginner";

    [Column("duration_value")] public int? DurationValue { get; set; }
    [Column("duration_unit")] public string? DurationUnit { get; set; }
    [Column("duration_days")] public int DurationDays { get; set; }

    [Column("is_lock")] public bool IsLock { get; set; }
    [Column("is_final_assessment")] public bool IsFinalAssessment { get; set; }
    [Column("is_draft")] public bool IsDraft { get; set; } = true;

    [Column("sort_order")] public int SortOrder { get; set; }

    [Column("is_pass")] public bool IsPass { get; set; } // instant mode: must pass to unlock next chapter/module unless faculty overrides
    [Column("is_review_unlock")] public bool IsReviewUnlock { get; set; } // review mode: next chapter/module stays locked until faculty reviews & marks

    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
}