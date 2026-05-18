require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const bcrypt     = require('bcryptjs');
const db         = require('./db');

const app = express();

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Brute-force protection on login: 5 attempts per 15 min per IP
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "5 ta noto'g'ri urinish. Kirish 15 daqiqaga bloklandi. Iltimos, kuting." },
}));

// ── ROUTES ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/entries',   require('./routes/entries'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users',     require('./routes/users'));

// ── STATIC FRONTEND ─────────────────────────────────────────
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// ── AUTO-MIGRATION & SEED ───────────────────────────────────
async function runMigrations() {
  console.log('Running database migrations...');

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

  await db.query(`CREATE INDEX IF NOT EXISTS idx_entries_date       ON entries(date)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_entries_category   ON entries(category)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by)`);

  // Seed default users only on first run
  const { rows } = await db.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) === 0) {
    const defaults = [
      { username: 'admin',     password: 'arkon08_sifat', role: 'admin'    },
      { username: 'boss',      password: 'boss123',       role: 'boss'      },
      { username: 'operator1', password: 'oper123',       role: 'operator'  },
      { username: 'operator2', password: 'oper123',       role: 'operator'  },
      { username: 'operator3', password: 'oper123',       role: 'operator'  },
    ];
    for (const u of defaults) {
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

// ── START ────────────────────────────────────────────────────
async function start() {
  try {
    await runMigrations();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
