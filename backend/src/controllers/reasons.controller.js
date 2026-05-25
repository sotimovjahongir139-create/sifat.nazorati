const db = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await db.query('SELECT id, name FROM custom_reasons ORDER BY created_at');
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Sabab nomi talab qilinadi' });
    const { rows } = await db.query(
      'INSERT INTO custom_reasons (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name',
      [name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { list, create };
