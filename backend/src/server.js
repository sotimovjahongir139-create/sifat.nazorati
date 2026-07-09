process.env.TZ = 'Asia/Tashkent';
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
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
