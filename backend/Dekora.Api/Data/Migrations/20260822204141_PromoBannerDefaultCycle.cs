using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class PromoBannerDefaultCycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PromoBannerCycleAnchor",
                table: "HomepageContent",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PromoBannerCycleAnchor",
                table: "HomepageContent");
        }
    }
}
