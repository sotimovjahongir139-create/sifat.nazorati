'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');
const { checkAI, getApiKey, toGeminiHistory } = require('../analytics/services/config');

async function analyze(req, res, next) {
  try {
    if (req.user.username !== 'admin3') {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }

    const aiCheck = checkAI();
    if (!aiCheck.ok) {
      return res.status(aiCheck.status).json({ error: aiCheck.error });
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

    const systemInstruction =
      "Sen sifat nazorati bo'yicha ekspert data-analitiksan. Senga real fabrika ishlab chiqarish nuqsonlari ma'lumotlari beriladi. " +
      "Quyidagilarni qil: 1) Eng kritik muammolarni aniqla va xavf darajasini belgilа (Yuqori/O'rta/Past) " +
      "2) Har bir model uchun alohida tavsiya ber 3) Nuqson sabablari bo'yicha chuqur tahlil qil " +
      "4) Keyingi 7 kun uchun bashorat qil 5) Ishlab chiqarishni yaxshilash uchun 5 ta konkret qadam tavsiya qil. " +
      "Javobni o'zbek tilida, professional va aniq yoz.\n\nReal fabrika ma'lumotlari:\n" + dataContext;

    let responseText;
    try {
      const genAI = new GoogleGenerativeAI(getApiKey());
      const model = genAI.getGenerativeModel({
        model:             'gemini-2.5-flash',
        systemInstruction,
      });

      if (messages.length > 0) {
        // Multi-turn: history = all but last message, then send last user message
        const history  = toGeminiHistory(messages.slice(0, -1));
        const lastMsg  = messages[messages.length - 1].content;
        const chat     = model.startChat({ history });
        const result   = await chat.sendMessage(lastMsg);
        responseText   = result.response.text();
      } else {
        const result = await model.generateContent("Ushbu ma'lumotlarni to'liq tahlil qil. Barcha bo'limlarni qamrab ol.");
        responseText = result.response.text();
      }
    } catch (aiErr) {
      const msg = aiErr.message || '';
      if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) {
        return res.status(503).json({ error: "AI xizmati vaqtincha mavjud emas — API kalit tekshiruvi muvaffaqiyatsiz." });
      }
      return res.status(503).json({ error: "AI xizmati vaqtincha mavjud emas. Administrator bilan bog'laning." });
    }

    res.json({ text: responseText });
  } catch (err) { next(err); }
}

module.exports = { analyze };
