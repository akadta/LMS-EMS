using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessment_attempts")]
public class AssessmentAttempt
{
    [Column("id")] public int Id { get; set; }
    [Column("assessment_id")] public int AssessmentId { get; set; }
    [ForeignKey("AssessmentId")] public Assessment? Assessment { get; set; }

    [Column("student_id")] public int StudentId { get; set; }
    [ForeignKey("StudentId")] public Student? Student { get; set; }

    [Column("mode")] public string Mode { get; set; } = "instant";

    // status: submitted | grading | graded | approved
    [Column("status")] public string Status { get; set; } = "submitted";

    [Column("total_possible")] public double? TotalPossible { get; set; }
    [Column("total_awarded")] public double? TotalAwarded { get; set; }
    [Column("percent")] public double? Percent { get; set; }
    [Column("passed")] public bool? Passed { get; set; }
    [Column("grade")] public string? Grade { get; set; }

    [Column("faculty_override_unlock")] public bool FacultyOverrideUnlock { get; set; }
    [Column("reviewed_by_faculty_id")] public int? ReviewedByFacultyId { get; set; }
    [Column("reviewed_at")] public DateTime? ReviewedAt { get; set; }

    [Column("submitted_at")] public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public DateTime StartedAt { get; set; }
public DateTime? ExpiresAt { get; set; }

    public ICollection<AssessmentAttemptAnswer> Answers { get; set; } = new List<AssessmentAttemptAnswer>();
}