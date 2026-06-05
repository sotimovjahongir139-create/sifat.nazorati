const bcrypt = require('bcryptjs');
const db     = require('../config/database');

const SEED_USERS = [
  { username: 'admin2',         password: 'arkon08_sifat', role: 'admin'    },
  { username: 'admin',          password: 'arkon07_sifat', role: 'boss'     },
  { username: 'sifat_nazorati', password: 'arkon09_sifat', role: 'operator' },
  { username: 'operator2',      password: 'oper123',       role: 'operator' },
  { username: 'operator3',      password: 'oper123',       role: 'operator' },
];

async function runMigrations() {
  console.log('Running migrations...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50)  UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin','boss','operator')),
      created_at    TIMESTAMPTZ  DEFAULT NOW()
    )
  `);

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
  await db.query(`CREATE INDEX IF NOT EXISTS idx_qr_material        ON quality_records(material_type)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_qr_date            ON quality_records(date)`);

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
