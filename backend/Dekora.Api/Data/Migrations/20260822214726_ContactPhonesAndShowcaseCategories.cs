using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ContactPhonesAndShowcaseCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "ShowcaseCategories",
                table: "Products",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<List<string>>(
                name: "PhoneNumbers",
                table: "ContactInfo",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowcaseCategories",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PhoneNumbers",
                table: "ContactInfo");
        }
    }
}
