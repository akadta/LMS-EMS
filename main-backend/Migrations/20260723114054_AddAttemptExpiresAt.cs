using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAttemptExpiresAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "assessment_attempts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "assessment_attempts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "assessment_attempts");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "assessment_attempts");
        }
    }
}
