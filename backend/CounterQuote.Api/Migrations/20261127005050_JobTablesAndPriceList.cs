using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CounterQuote.Api.Migrations
{
    /// <inheritdoc />
    public partial class JobTablesAndPriceList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Material",
                table: "Jobs");

            migrationBuilder.AddColumn<string>(
                name: "QuoteDrawingSvg",
                table: "Jobs",
                type: "TEXT",
                maxLength: 500000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SavedAt",
                table: "Jobs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TearOut",
                table: "Jobs",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "Total",
                table: "Jobs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidUntil",
                table: "Jobs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AdditionalRequirements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JobId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdditionalRequirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdditionalRequirements_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EdgeProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PricePerLinearFt = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EdgeProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Fees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PriceGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuoteLineItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JobId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Counter = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", nullable: false),
                    Unit = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Rate = table.Column<decimal>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuoteLineItems_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Materials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PriceGroupId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Materials_PriceGroups_PriceGroupId",
                        column: x => x.PriceGroupId,
                        principalTable: "PriceGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PriceGroupRates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PriceGroupId = table.Column<int>(type: "INTEGER", nullable: false),
                    Thickness = table.Column<int>(type: "INTEGER", nullable: false),
                    PricePerSqFt = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceGroupRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PriceGroupRates_PriceGroups_PriceGroupId",
                        column: x => x.PriceGroupId,
                        principalTable: "PriceGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Counters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JobId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Room = table.Column<string>(type: "TEXT", nullable: false),
                    MaterialId = table.Column<int>(type: "INTEGER", nullable: false),
                    Thickness = table.Column<int>(type: "INTEGER", nullable: false),
                    EdgeProfileId = table.Column<int>(type: "INTEGER", nullable: false),
                    Backsplash = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Counters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Counters_EdgeProfiles_EdgeProfileId",
                        column: x => x.EdgeProfileId,
                        principalTable: "EdgeProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Counters_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Counters_Materials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Legs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CounterId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    Length = table.Column<double>(type: "REAL", nullable: false),
                    Depth = table.Column<double>(type: "REAL", nullable: false),
                    TurnAngle = table.Column<double>(type: "REAL", nullable: false),
                    BackCovered = table.Column<bool>(type: "INTEGER", nullable: false),
                    FrontCovered = table.Column<bool>(type: "INTEGER", nullable: false),
                    StartCovered = table.Column<bool>(type: "INTEGER", nullable: false),
                    EndCovered = table.Column<bool>(type: "INTEGER", nullable: false),
                    StartFrontRadius = table.Column<bool>(type: "INTEGER", nullable: false),
                    StartBackRadius = table.Column<bool>(type: "INTEGER", nullable: false),
                    EndFrontRadius = table.Column<bool>(type: "INTEGER", nullable: false),
                    EndBackRadius = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Legs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Legs_Counters_CounterId",
                        column: x => x.CounterId,
                        principalTable: "Counters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Cutouts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    LegId = table.Column<int>(type: "INTEGER", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", nullable: false),
                    Centerline = table.Column<double>(type: "REAL", nullable: false),
                    FaucetHoles = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cutouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cutouts_Legs_LegId",
                        column: x => x.LegId,
                        principalTable: "Legs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalRequirements_JobId",
                table: "AdditionalRequirements",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_Counters_EdgeProfileId",
                table: "Counters",
                column: "EdgeProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Counters_JobId",
                table: "Counters",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_Counters_MaterialId",
                table: "Counters",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Cutouts_LegId",
                table: "Cutouts",
                column: "LegId");

            migrationBuilder.CreateIndex(
                name: "IX_Fees_Kind",
                table: "Fees",
                column: "Kind",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Legs_CounterId",
                table: "Legs",
                column: "CounterId");

            migrationBuilder.CreateIndex(
                name: "IX_Materials_PriceGroupId",
                table: "Materials",
                column: "PriceGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_PriceGroupRates_PriceGroupId_Thickness",
                table: "PriceGroupRates",
                columns: new[] { "PriceGroupId", "Thickness" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuoteLineItems_JobId",
                table: "QuoteLineItems",
                column: "JobId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdditionalRequirements");

            migrationBuilder.DropTable(
                name: "Cutouts");

            migrationBuilder.DropTable(
                name: "Fees");

            migrationBuilder.DropTable(
                name: "PriceGroupRates");

            migrationBuilder.DropTable(
                name: "QuoteLineItems");

            migrationBuilder.DropTable(
                name: "Legs");

            migrationBuilder.DropTable(
                name: "Counters");

            migrationBuilder.DropTable(
                name: "EdgeProfiles");

            migrationBuilder.DropTable(
                name: "Materials");

            migrationBuilder.DropTable(
                name: "PriceGroups");

            migrationBuilder.DropColumn(
                name: "QuoteDrawingSvg",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "SavedAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "TearOut",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "Total",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ValidUntil",
                table: "Jobs");

            migrationBuilder.AddColumn<string>(
                name: "Material",
                table: "Jobs",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
