using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class MoveMarkingModeToQuestion_RemoveQuestionDraft : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "marking_mode",
                table: "assessments");

            migrationBuilder.DropColumn(
                name: "is_draft",
                table: "assessment_questions");

            migrationBuilder.AddColumn<string>(
                name: "marking_mode",
                table: "assessment_questions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "marking_mode",
                table: "assessment_questions");

            migrationBuilder.AddColumn<string>(
                name: "marking_mode",
                table: "assessments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "is_draft",
                table: "assessment_questions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
