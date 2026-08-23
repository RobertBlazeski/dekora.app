using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddImagesPromoManualOrdersReviewsAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameSq",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsManualEntry",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PromoBannerEnabled",
                table: "HomepageContent",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PromoBannerLink",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PromoBannerText",
                table: "HomepageContent",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NameSq",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsManualEntry",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PromoBannerEnabled",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "PromoBannerLink",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "PromoBannerText",
                table: "HomepageContent");
        }
    }
}
