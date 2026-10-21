using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPassAndReviewUnlockFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_pass",
                table: "modules",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_review_unlock",
                table: "modules",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_pass",
                table: "chapters",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_review_unlock",
                table: "chapters",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_pass",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "is_review_unlock",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "is_pass",
                table: "chapters");

            migrationBuilder.DropColumn(
                name: "is_review_unlock",
                table: "chapters");
        }
    }
}
