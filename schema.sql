CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  r2_key TEXT,
  mime_type TEXT,
  r2_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
