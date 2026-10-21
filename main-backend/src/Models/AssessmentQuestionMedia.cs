using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessment_question_media")]
public class AssessmentQuestionMedia
{
    [Column("id")] public int Id { get; set; }
    [Column("question_id")] public int QuestionId { get; set; }
    [ForeignKey("QuestionId")] public AssessmentQuestion? Question { get; set; }

    [Column("media_type")] public string MediaType { get; set; } = "image"; // image | video | document
    [Column("file_path")] public string FilePath { get; set; } = string.Empty;
    [Column("sort_order")] public int SortOrder { get; set; }
}