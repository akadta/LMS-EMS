using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessment_options")]
public class AssessmentOption
{
    [Column("id")] public int Id { get; set; }
    [Column("question_id")] public int QuestionId { get; set; }
    [ForeignKey("QuestionId")] public AssessmentQuestion? Question { get; set; }

    [Column("option_text")] public string OptionText { get; set; } = string.Empty;
    [Column("is_correct")] public bool IsCorrect { get; set; }
    [Column("mark")] public double? Mark { get; set; } // used when assessment.MarkingMode = per_option
    [Column("sort_order")] public int SortOrder { get; set; }
}