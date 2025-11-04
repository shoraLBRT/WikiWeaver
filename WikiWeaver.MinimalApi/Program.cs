using Microsoft.EntityFrameworkCore;
using WikiWeaver.Application;
using WikiWeaver.Application.Mappings;
using WikiWeaver.Infrastructure;
using WikiWeaver.Infrastructure.Data;
using WikiWeaver.MinimalApi.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<WikiWeaverDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddInfrastructure();
builder.Services.AddApplication();

builder.Services.AddAutoMapper(
    cfg => { },
    typeof(MappingProfile)
);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapNodeEndpoints();
app.MapArticleEndpoints();
app.MapParagraphEndpoints();

app.Run();

