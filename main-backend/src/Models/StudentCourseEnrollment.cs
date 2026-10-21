using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("student_course_enrollments")]
public class StudentCourseEnrollment
{
    [Column("id")] public int Id { get; set; }
    [Column("student_id")] public int StudentId { get; set; }
    [ForeignKey("StudentId")] public Student? Student { get; set; }

    [Column("batch_course_id")] public int BatchCourseId { get; set; }
    [ForeignKey("BatchCourseId")] public BatchCourse? BatchCourse { get; set; }

    [Column("started_at")] public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    [Column("expires_at")] public DateTime? ExpiresAt { get; set; }
    [Column("completed_at")] public DateTime? CompletedAt { get; set; }
}