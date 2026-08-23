using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dekora.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryCities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeliveryCity",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DeliveryCities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryCities", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryCities_Name",
                table: "DeliveryCities",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeliveryCities");

            migrationBuilder.DropColumn(
                name: "DeliveryCity",
                table: "Orders");
        }
    }
}
