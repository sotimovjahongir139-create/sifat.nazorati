const db = require('../config/database');

const VALID_CATS = ['qayta', 'yamala', 'orta'];

async function list(req, res, next) {
  try {
    const { date, category, sku, limit = 2000, offset = 0 } = req.query;
    const isPrivileged = ['admin', 'boss'].includes(req.user.role);
    const params = [];
    let idx   = 1;
    let where = 'WHERE 1=1';

    if (!isPrivileged) { where += ` AND e.created_by = $${idx++}`; params.push(req.user.id); }
    if (date)     { where += ` AND e.date = $${idx++}`;         params.push(date); }
    if (category) { where += ` AND e.category = $${idx++}`;     params.push(category); }
    if (sku)      { where += ` AND e.sku ILIKE $${idx++}`;      params.push(`%${sku}%`); }

    const sql = `
      SELECT e.id,
             TO_CHAR(e.date,'YYYY-MM-DD') AS date,
             e.sku, e.reason,
             e.category AS cat,
             e.qty, e.notes,
             e.created_at,
             u.username AS created_by_name
      FROM entries e
      LEFT JOIN users u ON e.created_by = u.id
      ${where}
      ORDER BY e.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(parseInt(limit), parseInt(offset));
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { date, sku, reason, category, qty, notes } = req.body;
    if (!date || !sku || !reason || !category || !qty) {
      return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
    }
    if (!VALID_CATS.includes(category)) {
      return res.status(400).json({ error: "Noto'g'ri brak turi" });
    }
    const qtyInt = parseInt(qty);
    if (isNaN(qtyInt) || qtyInt < 1) {
      return res.status(400).json({ error: "Miqdor 1 dan katta bo'lishi kerak" });
    }
    const { rows } = await db.query(
      `INSERT INTO entries (date, sku, reason, category, qty, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, TO_CHAR(date,'YYYY-MM-DD') AS date,
                 sku, reason, category AS cat, qty, notes, created_at`,
      [date, sku.trim(), reason.trim(), category, qtyInt, (notes || '').trim(), req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Faqat admin o'chira oladi" });
    }
    const { rows } = await db.query(
      'DELETE FROM entries WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Yozuv topilmadi' });
    res.json({ deleted: rows[0].id });
  } catch (err) { next(err); }
}

async function modelCauses(req, res, next) {
  try {
    const { model, month } = req.query;
    if (!model || !month) {
      return res.status(400).json({ error: 'model va month parametrlari kerak' });
    }
    const totRes = await db.query(
      `SELECT COALESCE(SUM(qty),0) AS total FROM entries WHERE sku=$1 AND TO_CHAR(date,'YYYY-MM')=$2`,
      [model, month]
    );
    const total = parseInt(totRes.rows[0].total);
    const { rows } = await db.query(
      `SELECT reason AS cause, SUM(qty)::int AS count FROM entries WHERE sku=$1 AND TO_CHAR(date,'YYYY-MM')=$2 GROUP BY reason ORDER BY count DESC`,
      [model, month]
    );
    res.json({
      model,
      total,
      causes: rows.map(r => ({
        cause: r.cause,
        count: r.count,
        percentage: total > 0 ? parseFloat((r.count / total * 100).toFixed(1)) : 0
      }))
    });
  } catch (err) { next(err); }
}

module.exports = { list, create, remove, modelCauses };
