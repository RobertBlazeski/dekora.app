using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryAndHomepageContentTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BannerCtaLabelEn",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BannerCtaLabelSq",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BannerSubtitleEn",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BannerSubtitleSq",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BannerTitleEn",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BannerTitleSq",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PromoBannerTextEn",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PromoBannerTextSq",
                table: "HomepageContent",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Categories",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameSq",
                table: "Categories",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BannerCtaLabelEn",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "BannerCtaLabelSq",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "BannerSubtitleEn",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "BannerSubtitleSq",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "BannerTitleEn",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "BannerTitleSq",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "PromoBannerTextEn",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "PromoBannerTextSq",
                table: "HomepageContent");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "NameSq",
                table: "Categories");
        }
    }
}
