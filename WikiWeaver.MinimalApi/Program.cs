using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using WikiWeaver.Application;
using WikiWeaver.Application.Mappings;
using WikiWeaver.Infrastructure;
using WikiWeaver.Infrastructure.Data;
using WikiWeaver.Infrastructure.UnitOfWork;
using WikiWeaver.MinimalApi.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<WikiWeaverDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddInfrastructure();
builder.Services.AddApplication();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddAutoMapper(
    cfg => { },
    typeof(MappingProfile)
);
builder.Services.AddEndpointsApiExplorer();

// Настройка JSON сериализации для обработки циклических ссылок
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWikiWeaverReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

builder.Services.AddHttpClient();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Demonstration-only seed data to make navigation/content visible in fresh local environments.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<WikiWeaverDbContext>();
    await DemoDataSeeder.SeedAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowWikiWeaverReact");

app.MapArticleContentEndpoints();
app.MapNavigationEndpoints();
app.MapNodeEndpoints();
app.MapArticleEndpoints();
app.MapParagraphEndpoints();
app.MapAdminEndpoints();

app.Run();
