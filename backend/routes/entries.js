const router      = require('express').Router();
const db          = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

const VALID_CATS = ['qayta', 'yamala', 'orta'];

// GET /api/entries
router.get('/', async (req, res) => {
  try {
    const { date, category, sku, limit = 2000, offset = 0 } = req.query;
    const isPrivileged = ['admin', 'boss'].includes(req.user.role);

    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    // Operators see only their own entries
    if (!isPrivileged) {
      where += ` AND e.created_by = $${idx++}`;
      params.push(req.user.id);
    }
    if (date)     { where += ` AND e.date = $${idx++}`;                params.push(date); }
    if (category) { where += ` AND e.category = $${idx++}`;            params.push(category); }
    if (sku)      { where += ` AND e.sku ILIKE $${idx++}`;             params.push(`%${sku}%`); }

    const sql = `
      SELECT e.id,
             TO_CHAR(e.date, 'YYYY-MM-DD') AS date,
             e.sku, e.reason, e.category, e.qty, e.notes,
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
  } catch (err) {
    console.error('GET /entries error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/entries
router.post('/', async (req, res) => {
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
                 sku, reason, category, qty, notes, created_at`,
      [date, sku.trim(), reason.trim(), category, qtyInt, (notes || '').trim(), req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /entries error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// DELETE /api/entries/:id  — admin only
router.delete('/:id', async (req, res) => {
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
  } catch (err) {
    console.error('DELETE /entries error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
