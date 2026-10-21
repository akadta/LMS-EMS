using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("chapter_media")]
public class ChapterMedia
{
    [Column("id")] public int Id { get; set; }
    [Column("chapter_id")] public int ChapterId { get; set; }
    [ForeignKey("ChapterId")] public Chapter? Chapter { get; set; }

    [Column("media_type")] public string MediaType { get; set; } = "image"; // image, video, document
    [Column("file_path")] public string FilePath { get; set; } = string.Empty;
    [Column("caption")] public string? Caption { get; set; }
    [Column("sort_order")] public int SortOrder { get; set; }
}