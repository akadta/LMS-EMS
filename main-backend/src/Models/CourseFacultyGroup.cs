using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("course_faculty_groups")]
public class CourseFacultyGroup
{
    [Column("id")] public int Id { get; set; }
    [Column("course_id")] public int CourseId { get; set; }
    [ForeignKey("CourseId")] public Course? Course { get; set; }

    [Column("label")] public string Label { get; set; } = string.Empty; // e.g. "Technical Associates"
    [Column("sort_order")] public int SortOrder { get; set; }

    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CourseFacultyGroupMember> Members { get; set; } = new List<CourseFacultyGroupMember>();
}