using Microsoft.EntityFrameworkCore;
using WikiWeaver.Application;
using WikiWeaver.Application.Mappings;
using WikiWeaver.Application.Services;
using WikiWeaver.Infrastructure;
using WikiWeaver.Infrastructure.Data;
using WikiWeaver.Infrastructure.UnitOfWork;
using WikiWeaver.MinimalApi.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<WikiWeaverDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddInfrastructure();
builder.Services.AddApplication();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddAutoMapper(
    cfg => { },
    typeof(MappingProfile)
);
builder.Services.AddEndpointsApiExplorer();
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

builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowWikiWeaverReact");

app.MapArticleContentEndpoints();
app.MapNavigationEndpoints();
// TODO: will activate after MVP
//app.MapNodeEndpoints();
//app.MapArticleEndpoints();
//app.MapParagraphEndpoints();

app.Run();

