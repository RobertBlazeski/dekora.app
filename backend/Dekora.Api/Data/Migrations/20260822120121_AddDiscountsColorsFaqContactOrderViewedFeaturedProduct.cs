using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDiscountsColorsFaqContactOrderViewedFeaturedProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DiscountedPrice",
                table: "ProductSizes",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountedPrice",
                table: "Products",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ViewedByAdminAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FeaturedProductId",
                table: "HomepageContent",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContactInfo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InstagramHandle = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactInfo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FaqEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Question = table.Column<string>(type: "text", nullable: false),
                    QuestionEn = table.Column<string>(type: "text", nullable: true),
                    QuestionSq = table.Column<string>(type: "text", nullable: true),
                    Answer = table.Column<string>(type: "text", nullable: false),
                    AnswerEn = table.Column<string>(type: "text", nullable: true),
                    AnswerSq = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SavedColors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    HexValue = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedColors", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HomepageContent_FeaturedProductId",
                table: "HomepageContent",
                column: "FeaturedProductId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedColors_Name",
                table: "SavedColors",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_HomepageContent_Products_FeaturedProductId",
                table: "HomepageContent",
                column: "FeaturedProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HomepageContent_Products_FeaturedProductId",
                table: "HomepageContent");

            migrationBuilder.DropTable(
                name: "ContactInfo");

            migrationBuilder.DropTable(
                name: "FaqEntries");

            migrationBuilder.DropTable(
                name: "SavedColors");

            migrationBuilder.DropIndex(
                name: "IX_HomepageContent_FeaturedProductId",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "DiscountedPrice",
                table: "ProductSizes");

            migrationBuilder.DropColumn(
                name: "DiscountedPrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ViewedByAdminAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "FeaturedProductId",
                table: "HomepageContent");
        }
    }
}
