using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("batch_students")]
public class BatchStudent
{
    [Column("id")] public int Id { get; set; }
    [Column("batch_id")] public int BatchId { get; set; }
    [ForeignKey("BatchId")] public Batch? Batch { get; set; }

    [Column("student_id")] public int StudentId { get; set; }
    [ForeignKey("StudentId")] public Student? Student { get; set; }

    [Column("added_at")] public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}