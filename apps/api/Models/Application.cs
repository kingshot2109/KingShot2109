using System.ComponentModel.DataAnnotations;
namespace KingshotRecruitment.Api.Models;
public class RecruitmentApplication
{
 public int Id { get; set; }
 [MaxLength(60)] public string InGameName { get; set; } = string.Empty;
 public int CurrentKingdom { get; set; }
 public long TotalPower { get; set; }
 public long KillPoints { get; set; }
 [MaxLength(10)] public string TroopTier { get; set; } = string.Empty;
 [MaxLength(80)] public string DiscordHandle { get; set; } = string.Empty;
 [MaxLength(5)] public string PrimaryLanguage { get; set; } = string.Empty;
 [MaxLength(20)] public string TimeZone { get; set; } = string.Empty;
 [MaxLength(2048)] public string ScreenshotUrl { get; set; } = string.Empty;
 [MaxLength(2000)] public string AdditionalNotes { get; set; } = string.Empty;
 [MaxLength(10)] public string Status { get; set; } = "Pending";
 public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
 [MaxLength(64)] public string IpAddress { get; set; } = string.Empty;
}
