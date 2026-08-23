using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderNumberSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "order_number_seq",
                startValue: 10001L);

            // Bump the sequence past whatever order numbers already exist, so it continues
            // seamlessly instead of colliding with real "DK-100xx" rows already in the table.
            migrationBuilder.Sql("""
                SELECT setval(
                    'order_number_seq',
                    GREATEST(10001, COALESCE(
                        (SELECT MAX(CAST(SUBSTRING("OrderNumber" FROM 4) AS INTEGER))
                         FROM "Orders" WHERE "OrderNumber" ~ '^DK-[0-9]+$'),
                        10000) + 1),
                    false);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropSequence(
                name: "order_number_seq");
        }
    }
}
