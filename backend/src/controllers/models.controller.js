const db = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await db.query(
      'SELECT DISTINCT sku AS name FROM entries ORDER BY sku'
    );
    res.json(rows.map(r => r.name));
  } catch (err) { next(err); }
}

module.exports = { list };
