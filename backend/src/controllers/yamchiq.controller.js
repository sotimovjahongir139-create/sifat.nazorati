const db = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, TO_CHAR(date,'YYYY-MM-DD') AS date, mahsulot_soni, qayta_yamalgan, created_at
       FROM yamchiq_records ORDER BY date DESC, created_at DESC LIMIT 1000`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { date, mahsulot_soni, qayta_yamalgan = 0, izoh } = req.body;
    if (!date || mahsulot_soni == null) {
      return res.status(400).json({ error: "Sana va mahsulot soni kerak" });
    }
    const mahsulotInt = parseInt(mahsulot_soni);
    const qaytaInt    = parseInt(qayta_yamalgan) || 0;
    if (isNaN(mahsulotInt) || mahsulotInt < 1) {
      return res.status(400).json({ error: "Mahsulot soni 1 dan katta bo'lishi kerak" });
    }
    if (isNaN(qaytaInt) || qaytaInt < 0) {
      return res.status(400).json({ error: "Qayta yamalgan soni 0 dan katta bo'lishi kerak" });
    }
    const izohVal = izoh ? String(izoh).trim() || null : null;
    const { rows } = await db.query(
      `INSERT INTO yamchiq_records (date, mahsulot_soni, qayta_yamalgan, izoh, created_by)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, TO_CHAR(date,'YYYY-MM-DD') AS date, mahsulot_soni, qayta_yamalgan, izoh, created_at`,
      [date, mahsulotInt, qaytaInt, izohVal, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function summary(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(mahsulot_soni),0)::int AS jami_yamalgan,
              COALESCE(SUM(qayta_yamalgan),0)::int AS qayta_yamalganlar
       FROM yamchiq_records`
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { list, create, summary };
