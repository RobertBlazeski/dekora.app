using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Serialization;
using Dekora.Api.Data;
using Dekora.Api.Entities;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string AngularAppsCorsPolicy = "AngularApps";

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Dekora API", Version = "v1" });

    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste a JWT access token.",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    options.AddSecurityDefinition("Bearer", jwtScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtScheme, Array.Empty<string>() } });
});

builder.Services.AddDbContext<DekoraDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        // Set every complexity flag explicitly (not just the ones that differ from the
        // default) so the effective policy is fully documented here rather than partly
        // inherited from Identity's defaults — the customer-facing password hint text
        // and the frontend's mirrored client-side validator both depend on this exact
        // rule set staying in sync with what's written here. Identity's RequireLowercase/
        // RequireUppercase are case-specific ("must have a lowercase letter" vs. "any letter"),
        // which doesn't match the simple "8+ characters, a letter, a number" rule shown to
        // customers — both are left off here and replaced by RequiresLetterPasswordValidator
        // (registered below), which accepts a letter of either case.
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredUniqueChars = 1;
        options.User.RequireUniqueEmail = true;
        // Locks an account for 15 minutes after 5 failed login attempts — blunts credential
        // stuffing / brute force without a separate rate-limiting layer having to do it alone.
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<DekoraDbContext>()
    .AddDefaultTokenProviders()
    .AddPasswordValidator<RequiresLetterPasswordValidator>();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<BusinessRulesOptions>(builder.Configuration.GetSection(BusinessRulesOptions.SectionName));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.Configure<TelegramOptions>(builder.Configuration.GetSection(TelegramOptions.SectionName));
builder.Services.Configure<FrontendOptions>(builder.Configuration.GetSection(FrontendOptions.SectionName));
builder.Services.Configure<ImageStorageOptions>(builder.Configuration.GetSection(ImageStorageOptions.SectionName));

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration section is missing.");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddHttpClient<ITelegramSender, TelegramSender>();
builder.Services.AddScoped<INotificationSender, CompositeNotificationSender>();

// Auth endpoints get a stricter rate limit than the rest of the API — they're the ones
// worth throttling against credential stuffing / account-creation abuse / reset-link spam.
// Partitioned by client IP so one abusive caller can't exhaust another's quota.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(5),
            QueueLimit = 0,
        }));

    // Placing an order and leaving a review are both public, unauthenticated writes, and order
    // creation fires a real email/Telegram push to the owner on every call — with no throttling
    // a trivial script could flood the owner's phone or spam the reviews table. The limit is
    // generous enough that no real customer would ever hit it (nobody places 20 orders in 10
    // minutes), it's just there to block scripted abuse.
    options.AddPolicy("public-write", context => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
        {
            PermitLimit = 20,
            Window = TimeSpan.FromMinutes(10),
            QueueLimit = 0,
        }));
});

// Read from config (Cors:AllowedOrigins) rather than hardcoding, since production origins
// (the real domains) are different from the localhost ones used in dev.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy(AngularAppsCorsPolicy, policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DekoraDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

// Best-effort — registers this API's webhook URL with Telegram so the bot can respond to
// commands like /today, /week, /month (see TelegramWebhookController). Safe to call on every
// startup: Telegram's setWebhook is idempotent, and a briefly-unreachable Telegram API must
// never stop the app itself from starting.
var telegramOptionsAtStartup = builder.Configuration.GetSection(TelegramOptions.SectionName).Get<TelegramOptions>();
var frontendOptionsAtStartup = builder.Configuration.GetSection(FrontendOptions.SectionName).Get<FrontendOptions>();
if (!string.IsNullOrWhiteSpace(telegramOptionsAtStartup?.BotToken) && frontendOptionsAtStartup is not null)
{
    try
    {
        using var setupClient = new HttpClient();
        var webhookUrl = $"{frontendOptionsAtStartup.BaseUrl.TrimEnd('/')}/api/telegram/webhook";
        var secret = TelegramWebhookSecret.Compute(telegramOptionsAtStartup.BotToken);
        await setupClient.PostAsJsonAsync(
            $"https://api.telegram.org/bot{telegramOptionsAtStartup.BotToken}/setWebhook",
            new { url = webhookUrl, secret_token = secret });
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Failed to register Telegram webhook on startup");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// No UseHttpsRedirection here: in production this API sits behind a reverse proxy (Caddy)
// that terminates TLS and talks to Kestrel over plain HTTP — the proxy already enforces
// HTTPS at the edge, and redirecting again inside the container would just be wrong unless
// it trusts the forwarded headers below. This also avoids the local-dev-only problem where
// Node's SSR fetch doesn't trust ASP.NET Core's self-signed dev certificate.
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
// The reverse proxy is a sibling container on the compose network, not localhost, so the
// default loopback-only trust list would silently ignore its forwarded headers. The only way
// to reach this container is through that proxy (its port isn't published), so trusting the
// internal network here is safe.
forwardedHeadersOptions.KnownNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

// Serves wwwroot/uploads (product photos, homepage banner image) — public, no auth needed to
// view an already-uploaded image, only to upload one (see UploadsController).
app.UseStaticFiles();

app.UseCors(AngularAppsCorsPolicy);

// Baseline security headers for every response. CSP is deliberately left out here: the
// Angular apps are served separately (not by this API) and a correct CSP is theirs to set —
// getting it wrong on the API's JSON responses would just be noise.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()";
    await next();
});

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
