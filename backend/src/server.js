require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const config     = require('./config/config');
const runMigrations = require('./migrations/run');
const errorHandler  = require('./middleware/errorHandler');

const app = express();

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

if (config.nodeEnv !== 'test') {
  app.use(require('./middleware/logger'));
}

// Brute-force protection: 5 attempts per 15 min per IP
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "5 ta noto'g'ri urinish. Kirish 15 daqiqaga bloklandi. Iltimos, kuting." },
}));

// ── API ROUTES ──────────────────────────────────────────────
app.use('/api', require('./routes'));

// ── STATIC FRONTEND ─────────────────────────────────────────
const frontendDir = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use(errorHandler);

// ── START ────────────────────────────────────────────────────
async function start() {
  try {
    await runMigrations();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
