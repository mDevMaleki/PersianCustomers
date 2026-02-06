using IssabelCallMonitor.Hubs;
using IssabelCallMonitor.Models;
using IssabelCallMonitor.Services;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Controllers + JSON camelCase so your JS (rec.callDate etc) matches
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR(); // Only if you're using SignalR for real-time updates

// Config
builder.Services.Configure<IssabelConfiguration>(
    builder.Configuration.GetSection("Issabel"));

// Services
builder.Services.AddSingleton<AsteriskAmiService>();
builder.Services.AddHostedService<CallEventBridgeService>();

// CORS (simple dev friendly)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Disable Static Files (No wwwroot or index.html)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

// No need for static files or Razor pages, so no UseStaticFiles() or UseDefaultFiles()

app.Run();
