using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessment_grades")]
public class AssessmentGrade
{
    [Column("id")] public int Id { get; set; }
    [Column("assessment_id")] public int AssessmentId { get; set; }
    [ForeignKey("AssessmentId")] public Assessment? Assessment { get; set; }

    [Column("label")] public string Label { get; set; } = string.Empty;
    [Column("min_percentage")] public double MinPercentage { get; set; }
    [Column("max_percentage")] public double MaxPercentage { get; set; }
    [Column("sort_order")] public int SortOrder { get; set; }
}