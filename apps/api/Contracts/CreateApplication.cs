using System.ComponentModel.DataAnnotations;
namespace KingshotRecruitment.Api.Contracts;
public class CreateApplication
{
 [Required, StringLength(60, MinimumLength=2)] public string InGameName { get; set; } = "";
 [Range(1,999999)] public int CurrentKingdom { get; set; }
 [Range(1,1_000_000_000_000_000L)] public long TotalPower { get; set; }
 [Required, Range(0,1_000_000_000_000_000L)] public long? KillPoints { get; set; }
 [Required, RegularExpression("^(T4|T5|T5 Max)$")] public string TroopTier { get; set; } = "";
 [Required, StringLength(80, MinimumLength=2)] public string DiscordHandle { get; set; } = "";
 [Required, RegularExpression("^(en|de|es|zh|ko|ar|fr|pt|ms|ru|th|ja|hi|mr|ta|te|kn)$")] public string PrimaryLanguage { get; set; } = "";
 [Required, StringLength(20)] public string TimeZone { get; set; } = "";
 [StringLength(2048)] public string ScreenshotUrl { get; set; } = "";
 [StringLength(2000)] public string AdditionalNotes { get; set; } = "";
 [StringLength(200)] public string Website { get; set; } = "";
 public bool Consent { get; set; }
}
public record StatusUpdate(string Status, string ExpectedStatus);
