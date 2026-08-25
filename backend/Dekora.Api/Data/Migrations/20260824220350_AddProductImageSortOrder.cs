using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductImageSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "ProductImages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Every existing row just got SortOrder = 0, which would leave a product's multiple
            // photos all tied at 0 — exactly the same undefined-order problem this column exists
            // to fix. This gives each of a product's existing photos a distinct, stable position
            // instead, using whatever order Postgres happens to return them in right now as a
            // one-time starting point. It can't know which photo the owner actually intended as
            // the main one, so it's worth a quick check per product after this deploys — the
            // reorder buttons are what actually fix it from here on.
            migrationBuilder.Sql("""
                WITH ordered AS (
                    SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "ProductId" ORDER BY "Id") - 1 AS "Position"
                    FROM "ProductImages"
                )
                UPDATE "ProductImages" pi
                SET "SortOrder" = ordered."Position"
                FROM ordered
                WHERE pi."Id" = ordered."Id";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "ProductImages");
        }
    }
}
