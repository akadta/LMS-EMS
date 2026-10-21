using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessment_questions")]
public class AssessmentQuestion
{
    [Column("id")] public int Id { get; set; }
    [Column("assessment_id")] public int AssessmentId { get; set; }
    [ForeignKey("AssessmentId")] public Assessment? Assessment { get; set; }

    [Column("question_text")] public string QuestionText { get; set; } = string.Empty;

    // mcq_single | mcq_multi | short_answer | long_answer
    [Column("question_type")] public string QuestionType { get; set; } = "mcq_single";

    [Column("mark")] public double? Mark { get; set; } // used when assessment.MarkingMode = per_question
    [Column("marking_mode")] public string MarkingMode { get; set; } = "per_question"; // per_question | per_option
    [Column("sort_order")] public int SortOrder { get; set; }

    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AssessmentOption> Options { get; set; } = new List<AssessmentOption>();
    public ICollection<AssessmentQuestionMedia> Media { get; set; } = new List<AssessmentQuestionMedia>();
}