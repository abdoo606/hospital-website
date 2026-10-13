-- ============================================================
--  Private Hospital CMS — schema (SQLite)
--  Portable SQL: swapping to PostgreSQL/MySQL is mechanical
--  (INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL, TEXT/JSON kept)
-- ============================================================

CREATE TABLE IF NOT EXISTS schema_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Editable site content ----------

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  tagline     TEXT    NOT NULL DEFAULT '',
  blurb       TEXT    NOT NULL DEFAULT '',
  icon        TEXT    NOT NULL DEFAULT 'sparkle',
  highlights  TEXT    NOT NULL DEFAULT '[]',   -- JSON array of strings
  wait_label  TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consultants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  title         TEXT    NOT NULL DEFAULT '',
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  credentials   TEXT    NOT NULL DEFAULT '',
  years         INTEGER NOT NULL DEFAULT 0,
  rating        REAL    NOT NULL DEFAULT 0,
  reviews       INTEGER NOT NULL DEFAULT 0,
  languages     TEXT    NOT NULL DEFAULT '',
  availability  TEXT    NOT NULL DEFAULT '',
  photo         TEXT    NOT NULL DEFAULT '',
  bio           TEXT    NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  published     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faqs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  question   TEXT    NOT NULL,
  answer     TEXT    NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS testimonials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  quote      TEXT    NOT NULL,
  name       TEXT    NOT NULL DEFAULT '',
  detail     TEXT    NOT NULL DEFAULT '',
  location   TEXT    NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS insurers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Patient enquiries (real data collected by the site) ----------

CREATE TABLE IF NOT EXISTS appointments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reference       TEXT    NOT NULL UNIQUE,
  patient_name    TEXT    NOT NULL,
  email           TEXT    NOT NULL,
  phone           TEXT    NOT NULL,
  department      TEXT    NOT NULL DEFAULT '',
  consultant      TEXT    NOT NULL DEFAULT '',
  preferred_date  TEXT    NOT NULL DEFAULT '',
  preferred_time  TEXT    NOT NULL DEFAULT '',
  funder          TEXT    NOT NULL DEFAULT '',
  message         TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'new', -- new|contacted|booked|completed|cancelled|spam
  priority        TEXT    NOT NULL DEFAULT 'normal',
  notes           TEXT    NOT NULL DEFAULT '',
  source          TEXT    NOT NULL DEFAULT 'website',
  ip              TEXT    NOT NULL DEFAULT '',
  user_agent      TEXT    NOT NULL DEFAULT '',
  deleted_at      TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_status  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments(created_at DESC);

-- ---------- Staff accounts ----------

CREATE TABLE IF NOT EXISTS users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  name                 TEXT    NOT NULL,
  email                TEXT    NOT NULL UNIQUE,
  password_hash        TEXT    NOT NULL,
  role                 TEXT    NOT NULL DEFAULT 'editor', -- admin|editor
  must_change_password INTEGER NOT NULL DEFAULT 0,
  last_login_at        TEXT,
  disabled             INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Audit trail (who changed what, needed for healthcare compliance) ----------

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  user_email TEXT NOT NULL DEFAULT '',
  action     TEXT NOT NULL,          -- login|create|update|delete|export|upload
  entity     TEXT NOT NULL DEFAULT '',
  entity_id  TEXT NOT NULL DEFAULT '',
  detail     TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ---------- Uploaded media ----------

CREATE TABLE IF NOT EXISTS media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  filename      TEXT    NOT NULL UNIQUE,
  original_name TEXT    NOT NULL DEFAULT '',
  mime          TEXT    NOT NULL DEFAULT '',
  size          INTEGER NOT NULL DEFAULT 0,
  alt           TEXT    NOT NULL DEFAULT '',
  uploaded_by   TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('version', '1');
