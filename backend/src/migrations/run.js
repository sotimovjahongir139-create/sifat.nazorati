const bcrypt = require('bcryptjs');
const db     = require('../config/database');

const SEED_USERS = [
  { username: 'admin2',         password: 'arkon_08sifat', role: 'admin'    },
  { username: 'admin',          password: 'arkon07_sifat', role: 'boss'     },
  { username: 'sifat_nazorati', password: 'arkon09_sifat', role: 'operator' },
  { username: 'operator2',      password: 'oper123',       role: 'operator' },
  { username: 'operator3',      password: 'oper123',       role: 'operator' },
  { username: 'admin3',         password: 'arkon10_sifat', role: 'admin3'   },
  { username: 'admin14',        password: 'arkon14_sifat', role: 'admin'    },
];

async function runMigrations() {
  console.log('Running migrations...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50)  UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin','boss','operator','admin3')),
      created_at    TIMESTAMPTZ  DEFAULT NOW()
    )
  `);

  // Migrate admin14 role from 'admin14' → 'admin' so existing privilege checks work
  await db.query(`UPDATE users SET role='admin' WHERE username='admin14' AND role='admin14'`);

  // Idempotent: rebuild role constraint (drop admin14, keep admin3)
  await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
  await db.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','boss','operator','admin3'))`);

  await db.query(`
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
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS custom_reasons (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(200) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS quality_records (
      id            SERIAL PRIMARY KEY,
      date          DATE         NOT NULL,
      material_type VARCHAR(10)  NOT NULL CHECK (material_type IN ('PU','TEP')),
      model         VARCHAR(200) NOT NULL,
      gram          VARCHAR(50)  NOT NULL,
      created_by    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ  DEFAULT NOW()
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_entries_date       ON entries(date)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_entries_category   ON entries(category)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by)`);
  // Widen category CHECK to include yamchiq
  await db.query(`ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_category_check`);
  await db.query(`ALTER TABLE entries ADD CONSTRAINT entries_category_check CHECK (category IN ('qayta','yamala','orta','yamchiq'))`);
  await db.query(`ALTER TABLE quality_records ADD COLUMN IF NOT EXISTS qty INTEGER NOT NULL DEFAULT 1`);
  await db.query(`ALTER TABLE quality_records ADD COLUMN IF NOT EXISTS gramm INTEGER DEFAULT NULL`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_qr_material        ON quality_records(material_type)`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS model_grams (
      id            SERIAL PRIMARY KEY,
      material_type VARCHAR(10)  NOT NULL,
      model         VARCHAR(200) NOT NULL,
      gramm         INTEGER      NOT NULL CHECK (gramm > 0),
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      UNIQUE(material_type, model, gramm)
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_mg_model ON model_grams(material_type, model)`);
  // Migrate model_grams: individual gramm values → min_gram/max_gram range per model
  await db.query(`ALTER TABLE model_grams DROP CONSTRAINT IF EXISTS model_grams_material_type_model_gramm_key`);
  await db.query(`ALTER TABLE model_grams DROP COLUMN IF EXISTS gramm`);
  await db.query(`ALTER TABLE model_grams ADD COLUMN IF NOT EXISTS min_gram INTEGER NOT NULL DEFAULT 1`);
  await db.query(`ALTER TABLE model_grams ADD COLUMN IF NOT EXISTS max_gram INTEGER NOT NULL DEFAULT 1`);
  await db.query(`DELETE FROM model_grams mg1 USING model_grams mg2 WHERE mg1.id < mg2.id AND mg1.material_type = mg2.material_type AND mg1.model = mg2.model`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS model_grams_uniq ON model_grams(material_type, model)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_qr_date            ON quality_records(date)`);

  // Force-update admin2 password to arkon_08sifat
  const admin2Hash = await bcrypt.hash('arkon_08sifat', 10);
  await db.query(`UPDATE users SET password_hash=$1 WHERE username='admin2'`, [admin2Hash]);

  for (const u of SEED_USERS) {
    const { rows } = await db.query('SELECT id FROM users WHERE username = $1', [u.username]);
    if (!rows.length) {
      const hash = await bcrypt.hash(u.password, 10);
      await db.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1,$2,$3)',
        [u.username, hash, u.role]
      );
      console.log(`  Created user: ${u.username} (${u.role})`);
    }
  }

  console.log('Migrations complete.');
}

module.exports = runMigrations;
