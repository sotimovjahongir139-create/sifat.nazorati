const { Pool } = require('pg');
const config   = require('./config');

const pool = new Pool({
  connectionString: config.dbUrl,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'Asia/Tashkent'").catch((err) => {
    console.error('Failed to set session timezone:', err);
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
