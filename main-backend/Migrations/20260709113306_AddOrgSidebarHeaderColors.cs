using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgSidebarHeaderColors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "header_color",
                table: "organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "sidebar_color",
                table: "organizations",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "header_color",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "sidebar_color",
                table: "organizations");
        }
    }
}
