using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessments")]
public class Assessment
{
    [Column("id")] public int Id { get; set; }

    [Column("course_id")] public int? CourseId { get; set; }
    [Column("module_id")] public int? ModuleId { get; set; }
    [Column("chapter_id")] public int? ChapterId { get; set; }

    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("description")] public string? Description { get; set; }

    [Column("mode")] public string Mode { get; set; } = "instant"; // instant | review

    [Column("is_timer")] public bool IsTimer { get; set; }
    [Column("timer_scope")] public string? TimerScope { get; set; } // per_question | per_exam
    [Column("timer_value")] public int? TimerValue { get; set; }
    [Column("timer_unit")] public string? TimerUnit { get; set; } // seconds | minutes

    [Column("question_format")] public string QuestionFormat { get; set; } = "numeric"; // numeric | alpha_lower | alpha_upper
    [Column("option_format")] public string OptionFormat { get; set; } = "alpha_lower"; // numeric | alpha_lower | alpha_upper

    [Column("is_shuffle")] public bool IsShuffle { get; set; }
    [Column("pass_percentage")] public double? PassPercentage { get; set; }
    [Column("questions_to_show")] public int? QuestionsToShow { get; set; }

    [Column("is_published")] public bool IsPublished { get; set; }
    [Column("is_active")] public bool IsActive { get; set; } = true;
    [Column("is_draft")] public bool IsDraft { get; set; } = true;

    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AssessmentQuestion> Questions { get; set; } = new List<AssessmentQuestion>();
    public ICollection<AssessmentGrade> Grades { get; set; } = new List<AssessmentGrade>();
}