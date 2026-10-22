# KingShot Kingdom Recruitment

React + TypeScript recruitment SPA and ASP.NET Core 8 API with SQLite. Includes an interactive Three.js crest, 17 languages, RTL Arabic, validated recruitment form and protected admin dashboard at /admin.

## Start

Requires Node 20.19+ or 22.12+ and .NET 8 runtime/SDK (newer compatible SDKs work).

```powershell
cd 'C:\MyWebsite\Recruitment platform\KingShot2109-main'
npm ci
```

In one terminal configure a private admin key and start the API:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Admin__Token = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
npm run api
```

Keep that key privately for admin login. In another terminal run `npm run dev` and visit http://127.0.0.1:5173. Vite proxies /api to port 5080. SQLite lives in data/applications.db relative to the API working directory. Admin access is disabled without a 32+ character server key; the browser stores it only in memory.

## Configuration

Copy apps/web/.env.example to apps/web/.env.local. Set VITE_KINGDOM, VITE_DISCORD_INVITE, VITE_SITE_URL and the production VITE_API_URL. Never put an admin key in frontend variables. Kingdom 2109 is an assumption based on the repository name. Alliance descriptions and UTC event schedules in apps/web/src/config.ts use the supplied ORO, PHX, Val, HYD and BTC lineup. The overview shows five alliances, seven scheduled time slots and 17 languages instead of fabricated game figures. Power and membership totals have not been supplied. The Discord invite defaults to https://discord.gg/9ccyN53fC and can be overridden with VITE_DISCORD_INVITE.

All interface strings are in apps/web/src/locales/{en,de,es,zh,ko,ar,fr,pt,ms,ru,th,ja,hi,mr,ta,te,kn}.json. Edit scripts/locales.mjs before regenerating dictionaries with `node scripts/locales.mjs`. Arabic changes document direction. Native-speaker review is still needed before launch. Game names, alliance names, troop labels and UTC offsets remain language-neutral. Alliance statements retain the supplied English wording. The eight supplied screenshots are in apps/web/public/images and are displayed in a responsive gallery with full-image viewing. scripts/alliance-locales.mjs provides gallery translations and is automatically applied by scripts/locales.mjs.

## Checks

```powershell
npm run build
dotnet build KingshotRecruitment.sln
node scripts/check-api.mjs
```

The API integration check launches an isolated server on 5081 with a random key and database under ignored artifacts/. It verifies persistence, validation, consent, honeypot, rate limits, admin authorization, search, status conflicts, CSV formula escaping, CORS and all locale keys/interpolation placeholders. It does not modify the development DB.

## Cloudflare Pages

For a free static team preview, connect this GitHub repository to **Cloudflare Pages** and create a Pages project (not a Workers application). Set the repository root as the project root, use `npm run build` as the build command, set the build output directory to `apps/web/dist`, and use Node 22. Leave `VITE_API_URL` unset for a static-only preview; the public site renders normally, while application submission and admin data actions remain unavailable instead of sending requests to a missing API. The existing API code is retained and becomes active again when a real API origin is configured. `public/_redirects` supports SPA navigation to `/admin`.

After the first successful build, share the `https://<project-name>.pages.dev` URL shown in the Cloudflare Pages dashboard with your team. Set `VITE_SITE_URL` to that URL if you want canonical and social metadata populated, then redeploy. Let Pages deploy the build output; do not set `npx wrangler deploy` as a deploy command, because that deploys a Worker and does not publish this Pages site. For a working recruitment form and admin dashboard, separately host the API and configure the public API origin with `VITE_API_URL`.

For a manual Pages deployment after building, run `npx wrangler pages deploy apps/web/dist --project-name <your-pages-project-name>`.

## API hosting

Publish using `dotnet publish apps/api/KingshotRecruitment.Api.csproj -c Release -o artifacts/publish`, or build apps/api/Dockerfile with apps/api as context. Cloudflare Workers cannot directly run this ASP.NET Core process; deploy it to a .NET-capable host. Configure HTTPS at the host/reverse proxy and persistent database storage.

```text
Admin__Token=<32+ random secret characters>
ConnectionStrings__Applications=Data Source=/data/applications.db
Cors__Origins__0=https://your-site.pages.dev
ASPNETCORE_URLS=http://0.0.0.0:8080
```

Set Proxy__KnownProxies__0 to your actual trusted proxy IP for client IP forwarding. Otherwise rate limits use the direct peer address. SQLite uses EnsureCreatedAsync for initial setup; use one API instance with a persistent volume. Back up the DB, and adopt EF migrations before modifying a deployed schema. EnsureCreated does not migrate existing databases. IPs are private abuse metadata, omitted from admin output/export; establish an appropriate retention policy.

| Method | Route                          | Purpose                                                     |
| ------ | ------------------------------ | ----------------------------------------------------------- |
| GET    | /api/health                    | Readiness                                                   |
| POST   | /api/applications              | Validation and saving; five attempts per ten minutes per IP |
| GET    | /api/admin/applications        | Bearer-protected search/status filters and pagination       |
| PATCH  | /api/admin/applications/{id}   | status + expectedStatus; stale updates return 409           |
| GET    | /api/admin/applications/export | Filtered CSV including all matching rows                    |

Screenshot input is an HTTP(S) link; no uploads or remote downloads. Notes support 2,000 characters. Search matches IGN or exact kingdom number. Global limit: 100 requests per minute per peer IP.

## Git

This folder was downloaded as an archive. Origin is https://github.com/kingshot2109/KingShot2109.git and the local working branch is feat/recruitment-website. Git needs its own credential-manager login to fetch private main; the Codex connector login is separate. No remote history has been fetched yet. Connect to main without discarding these source files; do not use reset --hard.

Design inspiration: [LEXIMPERIA](https://www.leximperia.site/). Original geometric crest and scene. Unofficial Kingshot fan site, not affiliated with Century Games.
