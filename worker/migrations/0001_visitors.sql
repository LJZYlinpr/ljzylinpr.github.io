CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 1,
  last_seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS visitors_country ON visitors(country);
