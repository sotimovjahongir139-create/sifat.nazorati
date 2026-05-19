const db = require('../config/database');

async function dashboard(req, res, next) {
  try {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    const [todayR, monthR, topModelR, topReasonR, trendR] = await Promise.all([
      db.query('SELECT COALESCE(SUM(qty),0) AS total FROM entries WHERE date=$1', [today]),
      db.query(
        `SELECT COALESCE(SUM(qty),0) AS total FROM entries
         WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2`,
        [year, month]
      ),
      db.query(
        `SELECT sku, SUM(qty) AS total FROM entries
         WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2
         GROUP BY sku ORDER BY total DESC LIMIT 1`,
        [year, month]
      ),
      db.query(
        `SELECT reason, SUM(qty) AS total FROM entries
         GROUP BY reason ORDER BY total DESC LIMIT 1`
      ),
      db.query(
        `SELECT TO_CHAR(DATE_TRUNC('month',date),'YYYY-MM') AS month,
                COALESCE(SUM(qty),0) AS total
         FROM entries
         WHERE date >= NOW() - INTERVAL '6 months'
         GROUP BY month ORDER BY month`
      ),
    ]);

    res.json({
      today:      parseInt(todayR.rows[0].total),
      month:      parseInt(monthR.rows[0].total),
      top_model:  topModelR.rows[0] || null,
      top_reason: topReasonR.rows[0] || null,
      trend:      trendR.rows.map(r => ({ month: r.month, total: parseInt(r.total) })),
    });
  } catch (err) { next(err); }
}

async function topModels(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT sku AS name, SUM(qty) AS total
       FROM entries GROUP BY sku ORDER BY total DESC LIMIT 10`
    );
    res.json(rows.map(r => ({ name: r.name, total: parseInt(r.total) })));
  } catch (err) { next(err); }
}

module.exports = { dashboard, topModels };
