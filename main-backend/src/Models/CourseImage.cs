using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("course_images")]
public class CourseImage
{
    [Column("id")] public int Id { get; set; }
    [Column("course_id")] public int CourseId { get; set; }
    [ForeignKey("CourseId")] public Course? Course { get; set; }
    [Column("image_path")] public string ImagePath { get; set; } = string.Empty;
    [Column("sort_order")] public int SortOrder { get; set; }
}