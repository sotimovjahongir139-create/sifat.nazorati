const db = require('../config/database');

async function receive(req, res) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ARKON_API_KEY) {
      return res.status(401).json({ error: "Ruxsat yo'q" });
    }

    const { date, sku, qty } = req.body;

    if (!date || !sku || qty == null) {
      return res.status(400).json({ error: 'date, sku, qty majburiy' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: "Noto'g'ri sana formati" });
    }
    const skuStr = String(sku).trim();
    if (!skuStr) {
      return res.status(400).json({ error: 'date, sku, qty majburiy' });
    }
    const qtyInt = parseInt(qty);
    if (isNaN(qtyInt) || qtyInt < 1) {
      return res.status(400).json({ error: "qty musbat son bo'lishi kerak" });
    }

    const brakRes = await db.query(
      `SELECT COALESCE(SUM(qty), 0)::int AS brak FROM entries WHERE date = $1 AND sku ILIKE $2`,
      [date, skuStr]
    );
    const brak = brakRes.rows[0].brak;
    const foiz = Math.round((brak / qtyInt) * 100 * 100) / 100;

    const { rows } = await db.query(
      `INSERT INTO fakt_records (date, sku, qty, foiz)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date, sku) DO UPDATE SET qty = $3, foiz = $4, updated_at = NOW()
       RETURNING TO_CHAR(date,'YYYY-MM-DD') AS date, sku, qty, foiz`,
      [date, skuStr, qtyInt, foiz]
    );

    return res.json({
      success: true,
      date:  rows[0].date,
      sku:   rows[0].sku,
      fakt:  rows[0].qty,
      brak,
      foiz:  parseFloat(rows[0].foiz)
    });
  } catch (err) {
    console.error('fakt.receive error:', err);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}

async function monthlyFoiz(req, res) {
  try {
    const { rows } = await db.query(`
      WITH fakt_agg AS (
        SELECT TO_CHAR(date,'YYYY-MM') AS month, SUM(qty)::int AS fakt
        FROM fakt_records
        WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY 1
      ),
      brak_agg AS (
        SELECT TO_CHAR(date,'YYYY-MM') AS month, SUM(qty)::int AS brak
        FROM entries
        WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY 1
      )
      SELECT
        f.month,
        f.fakt,
        COALESCE(b.brak, 0) AS brak,
        CASE WHEN f.fakt > 0
          THEN ROUND((COALESCE(b.brak,0)::numeric / f.fakt * 100)::numeric, 2)
          ELSE 0
        END AS foiz
      FROM fakt_agg f
      LEFT JOIN brak_agg b ON b.month = f.month
      ORDER BY f.month
    `);
    res.json(rows.map(r => ({
      month: r.month,
      fakt:  r.fakt,
      brak:  r.brak,
      foiz:  parseFloat(r.foiz)
    })));
  } catch (err) {
    console.error('fakt.monthlyFoiz error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

module.exports = { receive, monthlyFoiz };
