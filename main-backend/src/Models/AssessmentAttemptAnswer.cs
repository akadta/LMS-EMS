using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessment_attempt_answers")]
public class AssessmentAttemptAnswer
{
    [Column("id")] public int Id { get; set; }
    [Column("attempt_id")] public int AttemptId { get; set; }
    [ForeignKey("AttemptId")] public AssessmentAttempt? Attempt { get; set; }

    [Column("question_id")] public int QuestionId { get; set; }
    [ForeignKey("QuestionId")] public AssessmentQuestion? Question { get; set; }

    [Column("selected_option_ids")] public string? SelectedOptionIdsJson { get; set; } // "[1,3]"
    [Column("text_answer")] public string? TextAnswer { get; set; }

    [Column("mark_awarded")] public double? MarkAwarded { get; set; } // set by grading (auto for instant, faculty for review)
    [Column("faculty_note")] public string? FacultyNote { get; set; }
}