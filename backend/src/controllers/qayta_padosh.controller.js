const db = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, TO_CHAR(date,'YYYY-MM-DD') AS date, qayta_soni, created_at
       FROM qayta_padosh_records ORDER BY date DESC, created_at DESC LIMIT 1000`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { date, qayta_soni } = req.body;
    if (!date || qayta_soni == null) {
      return res.status(400).json({ error: "Sana va miqdor kerak" });
    }
    const soniInt = parseInt(qayta_soni);
    if (isNaN(soniInt) || soniInt < 0) {
      return res.status(400).json({ error: "Miqdor 0 dan katta bo'lishi kerak" });
    }
    const { rows } = await db.query(
      `INSERT INTO qayta_padosh_records (date, qayta_soni, created_by)
       VALUES ($1,$2,$3)
       RETURNING id, TO_CHAR(date,'YYYY-MM-DD') AS date, qayta_soni, created_at`,
      [date, soniInt, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { list, create };
