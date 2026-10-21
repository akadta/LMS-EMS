using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("batch_courses")]
public class BatchCourse
{
    [Column("id")] public int Id { get; set; }
    [Column("batch_id")] public int BatchId { get; set; }
    [ForeignKey("BatchId")] public Batch? Batch { get; set; }

    [Column("course_id")] public int CourseId { get; set; }
    [ForeignKey("CourseId")] public Course? Course { get; set; }

    [Column("added_at")] public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BatchCourseStudent> AllocatedStudents { get; set; } = new List<BatchCourseStudent>();
}