using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using KingshotRecruitment.Api.Contracts;
using KingshotRecruitment.Api.Data;
using KingshotRecruitment.Api.Models;
using KingshotRecruitment.Api.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 16 * 1024);
builder.Services.AddDbContext<ApplicationDb>(options => options.UseSqlite(builder.Configuration.GetConnectionString("Applications")));
var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(origins).WithMethods("GET","POST","PATCH").WithHeaders("Content-Type","Authorization")));
builder.Services.AddAuthentication("AdminBearer").AddScheme<AuthenticationSchemeOptions,AdminAuthentication>("AdminBearer",_=>{});
builder.Services.AddAuthorization();
builder.Services.Configure<ForwardedHeadersOptions>(options => {
 options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
 foreach(var proxy in builder.Configuration.GetSection("Proxy:KnownProxies").Get<string[]>() ?? []) if(IPAddress.TryParse(proxy,out var ip)) options.KnownProxies.Add(ip);
});
builder.Services.AddRateLimiter(options => {
 options.RejectionStatusCode = 429;
 options.OnRejected = async (context, token) => { context.HttpContext.Response.Headers.RetryAfter="60"; await context.HttpContext.Response.WriteAsJsonAsync(new { error="rateLimited" },token); };
 options.AddPolicy("submit",context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",_=>new FixedWindowRateLimiterOptions{PermitLimit=5,Window=TimeSpan.FromMinutes(10),QueueLimit=0}));
 options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext,string>(context=>RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",_=>new FixedWindowRateLimiterOptions{PermitLimit=100,Window=TimeSpan.FromMinutes(1),QueueLimit=0}));
});
var app=builder.Build();
var connection = new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(builder.Configuration.GetConnectionString("Applications"));
if(connection.DataSource != ":memory:") Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(connection.DataSource))!);
using(var scope=app.Services.CreateScope()) await scope.ServiceProvider.GetRequiredService<ApplicationDb>().Database.EnsureCreatedAsync();
app.UseExceptionHandler(errorApp=>errorApp.Run(async context=>{context.Response.StatusCode=500;await context.Response.WriteAsJsonAsync(new {error="requestError"});}));
app.UseForwardedHeaders();
if(!app.Environment.IsDevelopment()) app.UseHsts();
app.UseCors();
app.UseRateLimiter();
app.Use(async (context,next)=>{
 context.Response.Headers.XContentTypeOptions="nosniff";
 context.Response.Headers.CacheControl="no-store";
 if(context.Request.Path.StartsWithSegments("/api/admin") && (builder.Configuration["Admin:Token"]?.Length ?? 0)<32){context.Response.StatusCode=503;await context.Response.WriteAsJsonAsync(new {error="notConfigured"});return;}
 await next();
});
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/api/health",()=>Results.Ok(new {status="ok"}));
app.MapPost("/api/applications",async (CreateApplication input,ApplicationDb db,HttpContext context)=>{
 if(!string.IsNullOrEmpty(input.Website)) return Results.BadRequest(new {error="requestError"});
 input.InGameName=Clean(input.InGameName);input.DiscordHandle=Clean(input.DiscordHandle);input.AdditionalNotes=Clean(input.AdditionalNotes);
 var errors=new List<ValidationResult>();
 Validator.TryValidateObject(input,new ValidationContext(input),errors,true);
 var validOffsets=new[]{"−12:00","−11:00","−10:00","−09:30","−09:00","−08:00","−07:00","−06:00","−05:00","−04:00","−03:30","−03:00","−02:00","−01:00","+00:00","+01:00","+02:00","+03:00","+03:30","+04:00","+04:30","+05:00","+05:30","+05:45","+06:00","+06:30","+07:00","+08:00","+08:45","+09:00","+09:30","+10:00","+10:30","+11:00","+12:00","+12:45","+13:00","+14:00"};
 if(!input.Consent || !validOffsets.Contains(input.TimeZone?.Replace("UTC","") ?? "") || !input.TimeZone!.StartsWith("UTC",StringComparison.Ordinal)) errors.Add(new ValidationResult("Invalid consent or timezone."));
 if(!string.IsNullOrEmpty(input.ScreenshotUrl) && (!Uri.TryCreate(input.ScreenshotUrl,UriKind.Absolute,out var uri)||uri.Scheme is not ("https" or "http"))) errors.Add(new ValidationResult("Invalid screenshot URL."));
 if(errors.Count>0) return Results.BadRequest(new {error="invalidField"});
 var row=new RecruitmentApplication{InGameName=input.InGameName,CurrentKingdom=input.CurrentKingdom,TotalPower=input.TotalPower,KillPoints=input.KillPoints!.Value,TroopTier=input.TroopTier,DiscordHandle=input.DiscordHandle,PrimaryLanguage=input.PrimaryLanguage,TimeZone=input.TimeZone!,ScreenshotUrl=input.ScreenshotUrl??"",AdditionalNotes=input.AdditionalNotes,IpAddress=context.Connection.RemoteIpAddress?.ToString()??"",SubmittedAt=DateTime.UtcNow};
 db.Applications.Add(row);await db.SaveChangesAsync();return Results.Json(new {id=row.Id,status=row.Status},statusCode:201);
}).RequireRateLimiting("submit");
var admin=app.MapGroup("/api/admin").RequireAuthorization();
admin.MapGet("/applications",async (ApplicationDb db,string? search,string? status,int? page,int? pageSize)=>{
 if(status is not null and not "" && !ValidStatus(status)) return Results.BadRequest();
 var current=Math.Clamp(page??1,1,100000);var size=Math.Clamp(pageSize??25,1,100);var query=Filter(db,search,status);var total=await query.CountAsync();var items=await query.OrderByDescending(a=>a.SubmittedAt).ThenByDescending(a=>a.Id).Skip((current-1)*size).Take(size).Select(a=>new {a.Id,a.InGameName,a.CurrentKingdom,a.TotalPower,a.KillPoints,a.TroopTier,a.DiscordHandle,a.PrimaryLanguage,a.TimeZone,a.ScreenshotUrl,a.AdditionalNotes,a.Status,a.SubmittedAt}).ToListAsync();return Results.Ok(new {items,total,page=current,pageSize=size});
});
admin.MapPatch("/applications/{id:int}",async (int id,StatusUpdate input,ApplicationDb db)=>{
 if(!ValidStatus(input.Status)||!ValidStatus(input.ExpectedStatus))return Results.BadRequest();
 var affected=await db.Applications.Where(a=>a.Id==id && a.Status==input.ExpectedStatus).ExecuteUpdateAsync(setters=>setters.SetProperty(a=>a.Status,input.Status));
 if(affected==0)return await db.Applications.AnyAsync(a=>a.Id==id)?Results.Conflict():Results.NotFound();return Results.NoContent();
});
admin.MapGet("/applications/export",async (ApplicationDb db,HttpContext context,string? search,string? status)=>{
 if(status is not null and not "" && !ValidStatus(status))return Results.BadRequest();
 context.Response.ContentType="text/csv; charset=utf-8";context.Response.Headers.ContentDisposition=$"attachment; filename=applications-{DateTime.UtcNow:yyyy-MM-dd}.csv";
 await context.Response.WriteAsync("\uFEFFId,InGameName,Kingdom,Power,KillPoints,TroopTier,Discord,Language,TimeZone,Screenshot,Notes,Status,SubmittedAt\r\n");
 await foreach(var a in Filter(db,search,status).OrderByDescending(a=>a.SubmittedAt).AsAsyncEnumerable().WithCancellation(context.RequestAborted)) await context.Response.WriteAsync(string.Join(',',new[]{a.Id.ToString(CultureInfo.InvariantCulture),Csv(a.InGameName),a.CurrentKingdom.ToString(CultureInfo.InvariantCulture),a.TotalPower.ToString(CultureInfo.InvariantCulture),a.KillPoints.ToString(CultureInfo.InvariantCulture),Csv(a.TroopTier),Csv(a.DiscordHandle),Csv(a.PrimaryLanguage),Csv(a.TimeZone),Csv(a.ScreenshotUrl),Csv(a.AdditionalNotes),Csv(a.Status),Csv(a.SubmittedAt.ToString("O"))})+"\r\n");
 return Results.Empty;
});
app.Run();
static bool ValidStatus(string? value)=>value is "Pending" or "Approved" or "Rejected";
static string Clean(string? value)=>Regex.Replace(Regex.Replace(value??"","<[^>]*>",""),"[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]","").Trim();
static string Csv(string value){if(value.TrimStart().StartsWith('=')||value.TrimStart().StartsWith('+')||value.TrimStart().StartsWith('-')||value.TrimStart().StartsWith('@')||value.StartsWith('\t')||value.StartsWith('\r'))value="'"+value;return "\""+value.Replace("\"","\"\"")+"\"";}
static IQueryable<RecruitmentApplication> Filter(ApplicationDb db,string? search,string? status){var query=db.Applications.AsNoTracking();if(!string.IsNullOrWhiteSpace(search)){search=search.Trim();if(search.Length>100)search=search[..100];var kingdom=int.TryParse(search.TrimStart('#'),out var k)?k:-1;query=query.Where(a=>a.InGameName.Contains(search)||a.CurrentKingdom==kingdom);}if(!string.IsNullOrEmpty(status))query=query.Where(a=>a.Status==status);return query;}

