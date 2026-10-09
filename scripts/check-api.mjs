import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../", import.meta.url));
const dir = fileURLToPath(new URL("../artifacts/", import.meta.url));
await mkdir(dir, { recursive: true });
const token = randomBytes(32).toString("hex");
const base = "http://127.0.0.1:5081/api";
const server = spawn(
  "dotnet",
  [
    fileURLToPath(
      new URL(
        "../apps/api/bin/Debug/net8.0/KingshotRecruitment.Api.dll",
        import.meta.url,
      ),
    ),
    "--urls",
    "http://127.0.0.1:5081",
  ],
  {
    cwd: root + "/apps/api",
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: "Development",
      Admin__Token: token,
      ConnectionStrings__Applications: `Data Source=${dir}/check-${Date.now()}.db`,
    },
    stdio: "pipe",
  },
);
let log = "";
server.stderr.on("data", (chunk) => {
  log += chunk;
});
server.stdout.on("data", (chunk) => {
  log += chunk;
});
async function request(path, body, method = "POST", key) {
  return fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base + "/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, log);
  assert.equal((await request("/admin/applications", null, "GET")).status, 401);
  const fixture = {
    inGameName: "=CSV Test",
    currentKingdom: 123,
    totalPower: 28000000,
    killPoints: 1000000,
    troopTier: "T5",
    discordHandle: "test.warrior",
    primaryLanguage: "en",
    timeZone: "UTC+05:30",
    screenshotUrl: "https://example.com/screenshot.png",
    additionalNotes: "<b>Ready</b>\n=IMPORTXML()",
    website: "",
    consent: true,
  };
  const submitted = await request("/applications", fixture);
  assert.equal(submitted.status, 201);
  const { id } = await submitted.json();
  for (const invalid of [
    { screenshotUrl: "javascript:alert(1)" },
    { website: "spam" },
    { consent: false },
    { killPoints: null },
  ])
    assert.equal(
      (await request("/applications", { ...fixture, ...invalid })).status,
      400,
    );
  assert.equal((await request("/applications", fixture)).status, 429);
  let list = await (
    await request(
      "/admin/applications?search=123&status=Pending",
      null,
      "GET",
      token,
    )
  ).json();
  assert.equal(list.total, 1);
  assert.equal(list.items[0].additionalNotes, "Ready\n=IMPORTXML()");
  assert.ok(!("ipAddress" in list.items[0]));
  assert.equal(
    (
      await request(
        `/admin/applications/${id}`,
        { status: "Approved", expectedStatus: "Pending" },
        "PATCH",
        token,
      )
    ).status,
    204,
  );
  assert.equal(
    (
      await request(
        `/admin/applications/${id}`,
        { status: "Rejected", expectedStatus: "Pending" },
        "PATCH",
        token,
      )
    ).status,
    409,
  );
  list = await (
    await request("/admin/applications?status=Approved", null, "GET", token)
  ).json();
  assert.equal(list.total, 1);
  const csv = await (
    await request(
      "/admin/applications/export?status=Approved",
      null,
      "GET",
      token,
    )
  ).text();
  assert.ok(csv.includes('"\'=CSV Test"'));
  assert.ok(csv.includes('"Ready\n=IMPORTXML()"'));
  const cors = await fetch(base + "/health", {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(
    cors.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
  const reference = JSON.parse(
    await readFile(
      new URL("../apps/web/src/locales/en.json", import.meta.url),
      "utf8",
    ),
  );
  for (const language of [
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
  ]) {
    const locale = JSON.parse(
      await readFile(
        new URL(`../apps/web/src/locales/${language}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.deepEqual(Object.keys(locale).sort(), Object.keys(reference).sort());
    for (const [key, value] of Object.entries(locale)) {
      assert.ok(value.length, `${language}.${key}`);
      assert.deepEqual(
        value.match(/{{\w+}}/g),
        reference[key].match(/{{\w+}}/g),
      );
    }
  }
  console.log(
    "PASS: submission, validation, honeypot, consent, rate limits, admin auth, filters, status conflicts, safe CSV, CORS, and 17 complete locales.",
  );
} finally {
  server.kill();
}
