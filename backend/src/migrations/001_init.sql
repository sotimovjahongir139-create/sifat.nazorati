-- Sifat Nazorati — Database schema v2
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin','boss','operator')),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id          SERIAL PRIMARY KEY,
  date        DATE         NOT NULL,
  sku         VARCHAR(100) NOT NULL,
  reason      VARCHAR(200) NOT NULL,
  category    VARCHAR(20)  NOT NULL CHECK (category IN ('qayta','yamala','orta')),
  qty         INTEGER      NOT NULL CHECK (qty > 0),
  notes       TEXT         DEFAULT '',
  created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_date       ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_category   ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);
