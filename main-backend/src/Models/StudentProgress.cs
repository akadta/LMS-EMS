using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("student_chapter_progress")]
public class StudentChapterProgress
{
    [Column("id")] public int Id { get; set; }
    [Column("student_id")] public int StudentId { get; set; }
    [Column("chapter_id")] public int ChapterId { get; set; }
    [Column("completed_at")] public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

[Table("student_module_progress")]
public class StudentModuleProgress
{
    [Column("id")] public int Id { get; set; }
    [Column("student_id")] public int StudentId { get; set; }
    [Column("module_id")] public int ModuleId { get; set; }
    [Column("completed_at")] public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}