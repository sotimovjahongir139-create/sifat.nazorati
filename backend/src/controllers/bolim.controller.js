const db = require('../config/database');

function toIntOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v);
  return isNaN(n) ? null : n;
}

async function list(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT id, TO_CHAR(date,'YYYY-MM-DD') AS date,
             dan, gacha, hodim_soni, padosh_soni,
             CASE WHEN gacha IS NOT NULL AND dan IS NOT NULL THEN gacha - dan END AS ish_soati,
             CASE WHEN gacha IS NOT NULL AND dan IS NOT NULL AND hodim_soni > 0 AND (gacha - dan) > 0 AND padosh_soni IS NOT NULL
               THEN ROUND(padosh_soni::numeric / (gacha - dan) / hodim_soni) END AS kishi_boshiga,
             created_at
      FROM bolim_ish_vaqti ORDER BY date DESC, created_at DESC LIMIT 1000
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function upsert(req, res, next) {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Sana kerak' });
    const dan        = toIntOrNull(req.body.dan);
    const gacha      = toIntOrNull(req.body.gacha);
    const hodim_soni  = toIntOrNull(req.body.hodim_soni);
    const padosh_soni = toIntOrNull(req.body.padosh_soni);

    if (gacha !== null && dan !== null && gacha <= dan) {
      return res.status(400).json({ error: "'Gacha' 'Dan'dan katta bo'lishi kerak" });
    }

    const { rows } = await db.query(`
      INSERT INTO bolim_ish_vaqti (date, dan, gacha, hodim_soni, padosh_soni, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (date) DO UPDATE SET
        dan         = COALESCE(EXCLUDED.dan,        bolim_ish_vaqti.dan),
        gacha       = COALESCE(EXCLUDED.gacha,      bolim_ish_vaqti.gacha),
        hodim_soni  = COALESCE(EXCLUDED.hodim_soni, bolim_ish_vaqti.hodim_soni),
        padosh_soni = COALESCE(EXCLUDED.padosh_soni,bolim_ish_vaqti.padosh_soni)
      RETURNING id, TO_CHAR(date,'YYYY-MM-DD') AS date, dan, gacha, hodim_soni, padosh_soni
    `, [date, dan, gacha, hodim_soni, padosh_soni, req.user.id]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { list, upsert };
