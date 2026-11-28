using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CounterQuote.Api.Migrations
{
    /// <inheritdoc />
    public partial class CounterOrientation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Mirrored",
                table: "Counters",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Rotation",
                table: "Counters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Mirrored",
                table: "Counters");

            migrationBuilder.DropColumn(
                name: "Rotation",
                table: "Counters");
        }
    }
}
