using CounterQuote.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

string dataFolder = Path.GetFullPath(builder.Configuration["DataFolder"] ?? "data", builder.Environment.ContentRootPath);
Directory.CreateDirectory(dataFolder);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={Path.Combine(dataFolder, "app.db")}"));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    Seed.Run(db);
}

app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run();
