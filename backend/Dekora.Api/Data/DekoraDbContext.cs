using Dekora.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Data;

public class DekoraDbContext(DbContextOptions<DekoraDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductSize> ProductSizes => Set<ProductSize>();
    public DbSet<ProductColorGroup> ProductColorGroups => Set<ProductColorGroup>();
    public DbSet<ProductColor> ProductColors => Set<ProductColor>();
    public DbSet<ProductExtra> ProductExtras => Set<ProductExtra>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<DailyMetric> DailyMetrics => Set<DailyMetric>();
    public DbSet<NotificationSettings> NotificationSettings => Set<NotificationSettings>();
    public DbSet<HomepageContent> HomepageContent => Set<HomepageContent>();
    public DbSet<SavedColor> SavedColors => Set<SavedColor>();
    public DbSet<FaqEntry> FaqEntries => Set<FaqEntry>();
    public DbSet<ContactInfo> ContactInfo => Set<ContactInfo>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<DeliveryCity> DeliveryCities => Set<DeliveryCity>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.FullName).HasMaxLength(200).IsRequired();
        });

        builder.Entity<Product>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(200).IsRequired();
            e.Property(p => p.BasePrice).HasPrecision(18, 2);
            e.Property(p => p.DiscountedPrice).HasPrecision(18, 2);
            e.Property(p => p.CustomSizeUnitPrice).HasPrecision(18, 2);
            e.Property(p => p.CustomSizeBaseFee).HasPrecision(18, 2);

            // List<string> maps as a primitive collection (a real Postgres text[]) by
            // convention — same as Tags — now that Categories is plain strings instead of an
            // enum, so no explicit PrimitiveCollection/HasConversion config is needed here
            // anymore (that was only required to keep the enum-typed version SQL-translatable).

            e.HasMany(p => p.Images).WithOne(i => i.Product!).HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.Sizes).WithOne(s => s.Product!).HasForeignKey(s => s.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.ColorGroups).WithOne(g => g.Product!).HasForeignKey(g => g.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.Extras).WithOne(x => x.Product!).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProductColorGroup>(e =>
            e.HasMany(g => g.Colors).WithOne(c => c.ProductColorGroup!).HasForeignKey(c => c.ProductColorGroupId).OnDelete(DeleteBehavior.Cascade));

        builder.Entity<ProductSize>(e =>
        {
            e.Property(s => s.Price).HasPrecision(18, 2);
            e.Property(s => s.DiscountedPrice).HasPrecision(18, 2);
        });
        builder.Entity<ProductExtra>(e => e.Property(x => x.Price).HasPrecision(18, 2));

        builder.Entity<Order>(e =>
        {
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.Property(o => o.Subtotal).HasPrecision(18, 2);
            e.Property(o => o.DeliveryFee).HasPrecision(18, 2);
            e.Property(o => o.PointsDiscount).HasPrecision(18, 2);
            e.Property(o => o.Total).HasPrecision(18, 2);
            e.Property(o => o.PaymentMethod).HasConversion<string>().HasMaxLength(30);
            e.Property(o => o.Status).HasConversion<string>().HasMaxLength(30);

            // Guest orders keep CustomerId null and are never deleted when a user account is removed.
            e.HasOne(o => o.Customer).WithMany().HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(o => o.Items).WithOne(i => i.Order!).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrderItem>(e =>
        {
            e.Property(i => i.UnitPrice).HasPrecision(18, 2);
            e.Property(i => i.LineTotal).HasPrecision(18, 2);
        });

        builder.Entity<Review>(e =>
        {
            e.HasOne(r => r.Product).WithMany(p => p.Reviews).HasForeignKey(r => r.ProductId).OnDelete(DeleteBehavior.Cascade);
            // Nullable: reviews aren't gated on being logged in — see Review.CustomerId.
            e.HasOne(r => r.Customer).WithMany().HasForeignKey(r => r.CustomerId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<DailyMetric>(e => e.HasIndex(m => m.Date).IsUnique());

        builder.Entity<HomepageContent>(e =>
            e.HasOne(c => c.FeaturedProduct).WithMany().HasForeignKey(c => c.FeaturedProductId).OnDelete(DeleteBehavior.SetNull));

        builder.Entity<SavedColor>(e => e.HasIndex(c => c.Name).IsUnique());
        builder.Entity<Category>(e => e.HasIndex(c => c.Name).IsUnique());
        builder.Entity<DeliveryCity>(e => e.HasIndex(c => c.Name).IsUnique());

        // Backs OrdersController.NextOrderNumberAsync — a real DB sequence so concurrent
        // checkouts can never land on the same OrderNumber (see that method's comment).
        builder.HasSequence<int>("order_number_seq").StartsAt(10001);
    }
}
