CREATE TABLE recruitment_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  in_game_name TEXT NOT NULL,
  current_kingdom INTEGER NOT NULL,
  total_power INTEGER NOT NULL,
  kill_points INTEGER NOT NULL,
  troop_tier TEXT NOT NULL,
  discord_handle TEXT NOT NULL,
  primary_language TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  screenshot_url TEXT NOT NULL DEFAULT '',
  additional_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  submitted_at TEXT NOT NULL
);

CREATE INDEX recruitment_applications_submitted_at
  ON recruitment_applications (submitted_at DESC);

CREATE TABLE submission_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);