const db = require('../config/database');

const VALID_MATERIALS = ['PU', 'TEP'];

async function list(req, res, next) {
  try {
    const { material_type } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (material_type) {
      where += ` AND q.material_type = $${idx++}`;
      params.push(material_type);
    }

    const sql = `
      SELECT q.id,
             TO_CHAR(q.date,'YYYY-MM-DD') AS date,
             q.material_type, q.model, q.gram, q.qty,
             q.created_at,
             u.username AS created_by_name
      FROM quality_records q
      LEFT JOIN users u ON q.created_by = u.id
      ${where}
      ORDER BY q.created_at DESC
      LIMIT 5000
    `;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { date, material_type, model, gram = '', qty } = req.body;
    if (!date || !material_type || !model || !qty) {
      return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
    }
    if (!VALID_MATERIALS.includes(material_type)) {
      return res.status(400).json({ error: "Noto'g'ri material turi" });
    }
    const qtyInt = parseInt(qty);
    if (isNaN(qtyInt) || qtyInt < 1) {
      return res.status(400).json({ error: "Miqdor 1 dan katta bo'lishi kerak" });
    }

    const { rows } = await db.query(
      `INSERT INTO quality_records (date, material_type, model, gram, qty, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, TO_CHAR(date,'YYYY-MM-DD') AS date, material_type, model, gram, qty, created_at`,
      [date, material_type, model.trim(), String(gram).trim(), qtyInt, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function deleteByModel(req, res, next) {
  try {
    if (req.user.username !== 'admin2') {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }
    const { material_type, model } = req.query;
    if (!material_type || !model) {
      return res.status(400).json({ error: "material_type va model kerak" });
    }
    await db.query(
      'DELETE FROM quality_records WHERE material_type = $1 AND model = $2',
      [material_type, model.trim()]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function deleteAll(req, res, next) {
  try {
    if (req.user.username !== 'admin2') {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }
    await db.query('DELETE FROM quality_records');
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, deleteByModel, deleteAll };
