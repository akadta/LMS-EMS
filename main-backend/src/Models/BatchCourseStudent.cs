using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("batch_course_students")]
public class BatchCourseStudent
{
    [Column("id")] public int Id { get; set; }
    [Column("batch_course_id")] public int BatchCourseId { get; set; }
    [ForeignKey("BatchCourseId")] public BatchCourse? BatchCourse { get; set; }

    [Column("student_id")] public int StudentId { get; set; }
    [ForeignKey("StudentId")] public Student? Student { get; set; }

    [Column("allocated_at")] public DateTime AllocatedAt { get; set; } = DateTime.UtcNow;
}