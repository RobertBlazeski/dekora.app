using Dekora.Api.Constants;
using Dekora.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Data;

public static class DbSeeder
{
    // Ensures the roles the API authorizes against exist, and that a single
    // NotificationSettings row is always present for the admin dashboard to read/edit.
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in new[] { Roles.Admin, Roles.Customer })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }

        var db = services.GetRequiredService<DekoraDbContext>();

        // Seeded with the same 5 names the site originally shipped with — kept exact so the
        // existing "categories.*" translation keys in the customer app still match them. Any
        // category the owner adds later just displays as its raw name (see resolveLocalizedText
        // conventions elsewhere) since there's no translation entry for it.
        if (!await db.Categories.AnyAsync())
        {
            var defaults = new[] { "Birthdays", "Weddings", "NewBaby", "Graduation", "JustBecause" };
            for (var i = 0; i < defaults.Length; i++)
                db.Categories.Add(new Category { Name = defaults[i], SortOrder = i });
            await db.SaveChangesAsync();
        }

        // All 80 official municipalities of North Macedonia plus the City of Skopje, in their
        // official Cyrillic names — Tetovo pinned first since it's where the shop is based, the
        // rest alphabetical. The owner can still add more from the manual-order city picker
        // (e.g. a specific village/neighborhood a customer asks for), same as categories.
        if (!await db.DeliveryCities.AnyAsync())
        {
            var cities = new[]
            {
                "Тетово",
                "Аеродром", "Арачиново", "Берово", "Битола", "Богданци", "Боговиње", "Босилово",
                "Брвеница", "Бутел", "Валандово", "Василево", "Вевчани", "Велес", "Виница",
                "Врапчиште", "Гази Баба", "Гевгелија", "Гостивар", "Градско", "Ѓорче Петров",
                "Дебар", "Дебарца", "Делчево", "Демир Капија", "Демир Хисар", "Дојране",
                "Долнени", "Желино", "Зелениково", "Зрновци", "Илинден", "Јегуновце",
                "Кавадарци", "Карбинци", "Карпош", "Кисела Вода", "Кичево", "Конче", "Кочани",
                "Кратово", "Крива Паланка", "Кривогаштани", "Крушево", "Куманово", "Липково",
                "Лозово", "Маврово и Ростуша", "Македонска Каменица", "Македонски Брод",
                "Могила", "Неготино", "Новаци", "Ново Село", "Охрид", "Петровец", "Пехчево",
                "Пласница", "Прилеп", "Пробиштип", "Радовиш", "Ранковце", "Ресен", "Росоман",
                "Сарај", "Свети Николе", "Скопје", "Сопиште", "Старо Нагоричане", "Струга",
                "Струмица", "Студеничани", "Теарце", "Центар", "Центар Жупа", "Чаир", "Чашка",
                "Чешиново", "Чучер Сандево", "Штип", "Шуто Оризари",
            };
            for (var i = 0; i < cities.Length; i++)
                db.DeliveryCities.Add(new DeliveryCity { Name = cities[i], SortOrder = i });
            await db.SaveChangesAsync();
        }

        if (!await db.NotificationSettings.AnyAsync())
        {
            db.NotificationSettings.Add(new NotificationSettings());
            await db.SaveChangesAsync();
        }

        if (!await db.HomepageContent.AnyAsync())
        {
            db.HomepageContent.Add(new HomepageContent
            {
                BannerTitle = "Give a moment they'll keep.",
                BannerSubtitle = "Handmade satin bouquets, balloon boxes, baskets and event decor from Tetovo.",
                BannerCtaLabel = "Design your box",
                BannerCtaLink = "/shop",
            });
            await db.SaveChangesAsync();
        }

        if (!await db.ContactInfo.AnyAsync())
        {
            db.ContactInfo.Add(new ContactInfo
            {
                InstagramHandle = "@dekora.mk",
                Email = "hello@dekora.mk",
                Location = "Tetovo, North Macedonia",
            });
            await db.SaveChangesAsync();
        }

        if (!await db.FaqEntries.AnyAsync())
        {
            db.FaqEntries.AddRange(
                new FaqEntry
                {
                    Question = "How much does delivery cost, and how long does it take?",
                    Answer = "Delivery is a flat 170 ден across Tetovo. Once your order is marked as shipped, delivery can take up to 3 business days.",
                    SortOrder = 0,
                },
                new FaqEntry
                {
                    Question = "How can I pay?",
                    Answer = "Pay at delivery is available now — we'll call to confirm your order before preparing it. Card payment is coming soon.",
                    SortOrder = 1,
                },
                new FaqEntry
                {
                    Question = "How do points work?",
                    Answer = "You earn 5% of your order subtotal (excluding delivery) as points whenever you're signed in at checkout. Once you have at least 300 points, you can redeem them for 0.6 ден off per point.",
                    SortOrder = 2,
                },
                new FaqEntry
                {
                    Question = "Can I order without an account?",
                    Answer = "Yes — guest checkout is always available. Guest orders don't earn points and can't be tracked afterward; sign in if you'd like to track your order.",
                    SortOrder = 3,
                },
                new FaqEntry
                {
                    Question = "What if an item or color is sold out?",
                    Answer = "Sold-out products or colors are clearly marked and can't be added to your cart. Check back later — we restock regularly.",
                    SortOrder = 4,
                },
                new FaqEntry
                {
                    Question = "Can I request a custom order?",
                    Answer = "For custom requests, reach out to us directly using the contact details below and we'll do our best to help.",
                    SortOrder = 5,
                });
            await db.SaveChangesAsync();
        }
    }
}
