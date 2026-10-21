using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace main_backend.Migrations
{
    public partial class SyncOrgColorDefaults : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "header_color",
                table: "organizations",
                type: "text",
                nullable: true,
                defaultValue: "#0a0d16",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "sidebar_color",
                table: "organizations",
                type: "text",
                nullable: true,
                defaultValue: "#0e1220",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "header_color",
                table: "organizations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true,
                oldDefaultValue: "#0a0d16");

            migrationBuilder.AlterColumn<string>(
                name: "sidebar_color",
                table: "organizations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true,
                oldDefaultValue: "#0e1220");
        }
    }
}