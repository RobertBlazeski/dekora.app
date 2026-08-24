using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductExtraLocalizationAndCustomText : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CustomTextEnabled",
                table: "ProductExtras",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "ProductExtras",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameSq",
                table: "ProductExtras",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomTextEnabled",
                table: "ProductExtras");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "ProductExtras");

            migrationBuilder.DropColumn(
                name: "NameSq",
                table: "ProductExtras");
        }
    }
}
