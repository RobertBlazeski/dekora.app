using Dekora.Api.Entities;

namespace Dekora.Api.Services;

public interface IJwtTokenService
{
    string CreateToken(ApplicationUser user, IList<string> roles);
}
