using KingshotRecruitment.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace KingshotRecruitment.Api.Data;
public class ApplicationDb(DbContextOptions<ApplicationDb> options) : DbContext(options)
{
 public DbSet<RecruitmentApplication> Applications => Set<RecruitmentApplication>();
 protected override void OnModelCreating(ModelBuilder builder) { builder.Entity<RecruitmentApplication>().HasIndex(a => new { a.Status, a.SubmittedAt }); }
}
