using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using dotnet.Data;
using dotnet.Seeders;
using dotnet.Shared.Common;
using dotnet.Shared.Services;
using dotnet.Test.Interfaces;
using dotnet.Test.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
options.UseNpgsql(
    builder.Configuration.GetConnectionString("DefaultConnection")
));

builder.Services.AddControllers();
builder.Services.AddScoped<ITestService, TestService>();

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<IJwtService, JwtService>();


builder.Services.AddHttpClient("groq", client =>
{
    client.BaseAddress = new Uri("https://api.groq.com/openai/v1/");
    client.Timeout = TimeSpan.FromSeconds(60);
});
builder.Services.AddScoped<IAiQuestionService, GroqAiQuestionService>();

builder.Services.AddHttpClient("unsplash", client =>
{
    client.BaseAddress = new Uri("https://api.unsplash.com/");
    client.Timeout = TimeSpan.FromSeconds(20);
});
builder.Services.AddScoped<IImageSourceService, UnsplashImageService>();
builder.Services.AddScoped<IAiCourseStructureService, GroqCourseStructureService>();

var configuredPath = builder.Configuration["FileStorage:BasePath"] ?? "storage";
var storageBasePath = Path.IsPathRooted(configuredPath)
    ? configuredPath
    : Path.Combine(Directory.GetCurrentDirectory(), configuredPath);

Directory.CreateDirectory(storageBasePath);
builder.Services.AddSingleton<IFileStorageService>(new FileStorageService(storageBasePath));

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings!.Key)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://62.72.12.218:9044",
            "http://62.72.12.218:9045"
            )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (args.Contains("seed"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    await db.Database.MigrateAsync();
    await SystemRoleSeeder.SeedAsync(db);
    await AdminSeeder.SeedAsync(db);

    Console.WriteLine("Database seeded successfully.");
    return;
}

app.UseCors("AllowFrontend");

app.UseStaticFiles(); // for wwwroot if used
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(storageBasePath),
    RequestPath = "/storage"
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();