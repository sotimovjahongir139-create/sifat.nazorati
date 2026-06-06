const db = require('../config/database');

async function analyze(req, res, next) {
  try {
    if (req.user.username !== 'admin3') {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY sozlanmagan. Render env vars yoki .env ga qo'shing." });
    }

    const [entriesR, topModelsR, topReasonsR, trendR, categoryR, weekR] = await Promise.all([
      db.query(`
        SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, sku, reason, category, qty, notes
        FROM entries ORDER BY date DESC LIMIT 500
      `),
      db.query(`
        SELECT sku AS model, SUM(qty) AS total
        FROM entries GROUP BY sku ORDER BY total DESC LIMIT 15
      `),
      db.query(`
        SELECT reason, SUM(qty) AS total, COUNT(*) AS occurrences
        FROM entries GROUP BY reason ORDER BY total DESC LIMIT 15
      `),
      db.query(`
        SELECT TO_CHAR(DATE_TRUNC('month',date),'YYYY-MM') AS month,
               COALESCE(SUM(qty),0) AS total
        FROM entries WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month
      `),
      db.query(`
        SELECT category, SUM(qty) AS total
        FROM entries GROUP BY category ORDER BY total DESC
      `),
      db.query(`
        SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, SUM(qty) AS total
        FROM entries WHERE date >= NOW() - INTERVAL '7 days'
        GROUP BY date ORDER BY date
      `),
    ]);

    const { messages = [] } = req.body;

    const dataContext = JSON.stringify({
      top_models_by_defects:  topModelsR.rows.map(r => ({ model: r.model, total: parseInt(r.total) })),
      top_defect_reasons:     topReasonsR.rows.map(r => ({ reason: r.reason, total: parseInt(r.total), occurrences: parseInt(r.occurrences) })),
      monthly_trend_6mo:      trendR.rows.map(r => ({ month: r.month, total: parseInt(r.total) })),
      category_breakdown:     categoryR.rows.map(r => ({ category: r.category, total: parseInt(r.total) })),
      last_7_days_daily:      weekR.rows.map(r => ({ date: r.date, total: parseInt(r.total) })),
      total_entries_analyzed: entriesR.rows.length,
      recent_50_entries:      entriesR.rows.slice(0, 50),
    }, null, 2);

    const systemPrompt =
      "Sen sifat nazorati bo'yicha ekspert data-analitiksan. Senga real fabrika ishlab chiqarish nuqsonlari ma'lumotlari beriladi. " +
      "Quyidagilarni qil: 1) Eng kritik muammolarni aniqla va xavf darajasini belgilа (Yuqori/O'rta/Past) " +
      "2) Har bir model uchun alohida tavsiya ber 3) Nuqson sabablari bo'yicha chuqur tahlil qil " +
      "4) Keyingi 7 kun uchun bashorat qil 5) Ishlab chiqarishni yaxshilash uchun 5 ta konkret qadam tavsiya qil. " +
      "Javobni o'zbek tilida, professional va aniq yoz.\n\nReal fabrika ma'lumotlari:\n" + dataContext;

    const apiMessages = messages.length > 0
      ? messages
      : [{ role: 'user', content: "Ushbu ma'lumotlarni to'liq tahlil qil. Barcha bo'limlarni qamrab ol." }];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-8',
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   apiMessages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(502).json({ error: errBody.error?.message || 'Anthropic API xatosi' });
    }

    const result = await response.json();
    res.json({ text: result.content?.[0]?.text || '', usage: result.usage });
  } catch (err) { next(err); }
}

module.exports = { analyze };
