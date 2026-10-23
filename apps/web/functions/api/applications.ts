interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: { last_row_id?: number } }>;
}

interface Env {
  DB: {
    prepare(query: string): D1Statement;
  };
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface Submission {
  inGameName: string;
  currentKingdom: number;
  totalPower: number;
  killPoints: number;
  troopTier: string;
  discordHandle: string;
  primaryLanguage: string;
  timeZone: string;
  screenshotUrl: string;
  additionalNotes: string;
  website: string;
  consent: boolean;
}

const languages = new Set([
  "en",
  "de",
  "es",
  "zh",
  "ko",
  "ar",
  "fr",
  "pt",
  "ms",
  "ru",
  "th",
  "ja",
  "hi",
  "mr",
  "ta",
  "te",
  "kn",
]);

const timeZones = new Set([
  "UTC−12:00",
  "UTC−11:00",
  "UTC−10:00",
  "UTC−09:30",
  "UTC−09:00",
  "UTC−08:00",
  "UTC−07:00",
  "UTC−06:00",
  "UTC−05:00",
  "UTC−04:00",
  "UTC−03:30",
  "UTC−03:00",
  "UTC−02:00",
  "UTC−01:00",
  "UTC+00:00",
  "UTC+01:00",
  "UTC+02:00",
  "UTC+03:00",
  "UTC+03:30",
  "UTC+04:00",
  "UTC+04:30",
  "UTC+05:00",
  "UTC+05:30",
  "UTC+05:45",
  "UTC+06:00",
  "UTC+06:30",
  "UTC+07:00",
  "UTC+08:00",
  "UTC+08:45",
  "UTC+09:00",
  "UTC+09:30",
  "UTC+10:00",
  "UTC+10:30",
  "UTC+11:00",
  "UTC+12:00",
  "UTC+12:45",
  "UTC+13:00",
  "UTC+14:00",
]);

function json(body: unknown, status: number, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function clean(value: unknown) {
  return typeof value === "string"
    ? value
        .replace(/<[^>]*>/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .trim()
    : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validInteger(value: unknown, min: number, max: number) {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= min &&
    value <= max
  );
}

async function clientHash(request: Request) {
  const address = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function applySubmissionLimit(request: Request, env: Env) {
  const now = Math.floor(Date.now() / 1000);
  const hash = await clientHash(request);
  const result = await env.DB.prepare(
    `INSERT INTO submission_rate_limits (ip_hash, window_started_at, attempts)
     VALUES (?, ?, 1)
     ON CONFLICT(ip_hash) DO UPDATE SET
       attempts = CASE
         WHEN excluded.window_started_at - submission_rate_limits.window_started_at >= 600 THEN 1
         ELSE submission_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN excluded.window_started_at - submission_rate_limits.window_started_at >= 600 THEN excluded.window_started_at
         ELSE submission_rate_limits.window_started_at
       END
     RETURNING attempts, window_started_at`,
  )
    .bind(hash, now)
    .first<{ attempts: number; window_started_at: number }>();

  if (!result) throw new Error("Rate limit update failed");
  if (now % 60 === 0) {
    await env.DB.prepare(
      "DELETE FROM submission_rate_limits WHERE window_started_at < ?",
    )
      .bind(now - 600)
      .run();
  }

  return {
    allowed: result.attempts <= 5,
    retryAfter: Math.max(1, result.window_started_at + 600 - now),
  };
}

export async function onRequestPost({ request, env }: PagesContext) {
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > 16_384) return json({ error: "requestError" }, 413);

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json({ error: "requestError" }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > 16_384)
    return json({ error: "requestError" }, 413);

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalidField" }, 400);
  }
  if (!isRecord(input)) return json({ error: "invalidField" }, 400);

  const submission: Submission = {
    inGameName: clean(input.inGameName),
    currentKingdom: input.currentKingdom as number,
    totalPower: input.totalPower as number,
    killPoints: input.killPoints as number,
    troopTier: clean(input.troopTier),
    discordHandle: clean(input.discordHandle),
    primaryLanguage: clean(input.primaryLanguage),
    timeZone: clean(input.timeZone),
    screenshotUrl: clean(input.screenshotUrl),
    additionalNotes: clean(input.additionalNotes),
    website: typeof input.website === "string" ? input.website : "",
    consent: input.consent === true,
  };

  if (submission.website) return json({ error: "requestError" }, 400);

  const validUrl = (() => {
    if (!submission.screenshotUrl) return true;
    try {
      return ["http:", "https:"].includes(
        new URL(submission.screenshotUrl).protocol,
      );
    } catch {
      return false;
    }
  })();

  const valid =
    submission.inGameName.length >= 2 &&
    submission.inGameName.length <= 60 &&
    validInteger(submission.currentKingdom, 1, 999_999) &&
    validInteger(submission.totalPower, 1, 1_000_000_000_000_000) &&
    validInteger(submission.killPoints, 0, 1_000_000_000_000_000) &&
    ["T4", "T5", "T5 Max"].includes(submission.troopTier) &&
    submission.discordHandle.length >= 2 &&
    submission.discordHandle.length <= 80 &&
    languages.has(submission.primaryLanguage) &&
    timeZones.has(submission.timeZone) &&
    submission.screenshotUrl.length <= 2048 &&
    submission.additionalNotes.length <= 2000 &&
    submission.website.length <= 200 &&
    submission.consent &&
    validUrl;

  if (!valid) return json({ error: "invalidField" }, 400);

  try {
    const limit = await applySubmissionLimit(request, env);
    if (!limit.allowed)
      return json(
        { error: "rateLimited" },
        429,
        { "Retry-After": String(limit.retryAfter) },
      );

    const inserted = await env.DB.prepare(
      `INSERT INTO recruitment_applications (
         in_game_name, current_kingdom, total_power, kill_points, troop_tier,
         discord_handle, primary_language, time_zone, screenshot_url,
         additional_notes, submitted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
      .bind(
        submission.inGameName,
        submission.currentKingdom,
        submission.totalPower,
        submission.killPoints,
        submission.troopTier,
        submission.discordHandle,
        submission.primaryLanguage,
        submission.timeZone,
        submission.screenshotUrl,
        submission.additionalNotes,
        new Date().toISOString(),
      )
      .first<{ id: number }>();

    if (!inserted) throw new Error("Application insert failed");
    return json({ id: inserted.id, status: "Pending" }, 201);
  } catch {
    return json({ error: "requestError" }, 500);
  }
}