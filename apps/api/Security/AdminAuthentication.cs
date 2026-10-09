using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
namespace KingshotRecruitment.Api.Security;
public class AdminAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, IConfiguration configuration)
 : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
 protected override Task<AuthenticateResult> HandleAuthenticateAsync()
 {
  var configured = configuration["Admin:Token"];
  if(string.IsNullOrWhiteSpace(configured) || configured.Length < 32) return Task.FromResult(AuthenticateResult.Fail("Admin authentication is not configured."));
  var header = Request.Headers.Authorization.ToString();
  if(!header.StartsWith("Bearer ",StringComparison.OrdinalIgnoreCase)) return Task.FromResult(AuthenticateResult.NoResult());
  var provided = header[7..];
  if(!CryptographicOperations.FixedTimeEquals(SHA256.HashData(Encoding.UTF8.GetBytes(configured)),SHA256.HashData(Encoding.UTF8.GetBytes(provided)))) return Task.FromResult(AuthenticateResult.Fail("Invalid token."));
  var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name,"KingdomAdmin") }, Scheme.Name);
  return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
 }
}
