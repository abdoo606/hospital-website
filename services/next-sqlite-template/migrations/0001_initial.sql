-- Forward-only initial schema. No credentials or customer records are seeded.
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
