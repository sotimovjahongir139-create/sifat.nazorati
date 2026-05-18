-- Sifat Nazorati — Database schema
-- Run manually via Render PostgreSQL shell if needed
-- Note: server.js runs this automatically on first start

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(50)  UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  role         VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'boss', 'operator')),
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id           SERIAL PRIMARY KEY,
  date         DATE         NOT NULL,
  sku          VARCHAR(100) NOT NULL,
  reason       VARCHAR(200) NOT NULL,
  category     VARCHAR(20)  NOT NULL CHECK (category IN ('qayta', 'yamala', 'orta')),
  qty          INTEGER      NOT NULL CHECK (qty > 0),
  notes        TEXT         DEFAULT '',
  created_by   INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_date      ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_category  ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);

-- ── BOSHLANG'ICH FOYDALANUVCHILAR ─────────────────────────
-- Parollar bcryptjs saltRounds:10 bilan hashlangan
-- ON CONFLICT DO NOTHING — mavjud bo'lsa o'tkazib yuboradi

INSERT INTO users (username, password_hash, role) VALUES
  ('admin2',         '$2a$10$YBT/ERnvcsTbCJ13R29y1Ob5/TJM/QDQz7F3CVo09Hqh/LxSqdPDe', 'admin'),
  ('admin',          '$2a$10$jnFzqlLQInOD23rsdVWa7ekm0C41c1.DMoPt9jZsSk7vRQKw8rmLq', 'boss'),
  ('sifat_nazorati', '$2a$10$mAuVebGdNtfNWqYIzcrbSOuhMK8.91IH.iDdpfCVkWSX.1h1KRhOO', 'operator'),
  ('operator2',      '$2a$10$yNZ.UjfiEKLAG1AEg0DnJucj26aTszR.xkJ0Wzqohqn2.5FLZSKQi', 'operator'),
  ('operator3',      '$2a$10$r7yQ4aPCIZt5wAfkWokyl.KaM/UxwhxkEqzb4saO7tGAQPB/fuerG', 'operator')
ON CONFLICT (username) DO NOTHING;
