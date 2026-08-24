using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderItemExtraCustomTexts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // defaultValueSql (not just defaultValue) is required here — OrderItems already has
            // real rows in production, and without a database-side default Postgres has nothing
            // to backfill them with, so the ALTER TABLE fails outright with "column contains
            // null values" on any deployment that isn't a brand-new empty table.
            migrationBuilder.AddColumn<List<string>>(
                name: "ExtraCustomTexts",
                table: "OrderItems",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtraCustomTexts",
                table: "OrderItems");
        }
    }
}
