'use strict';

const db           = require('../config/database');
const { runAnalysis } = require('../analytics/services/ai_engine');

const SYSTEM_PROMPT = `Sen sifat nazorati bo'yicha mutaxassis data-analitiksan. Senga real fabrika ishlab chiqarish ma'lumotlari va statistik tahlil natijalari beriladi.

TIL QO'LLASH (MAJBURIY):
- Foydalanuvchi o'zbek tilida (lotin harflar) yozsa → o'zbek tilida lotin harflarda javob ber
- Foydalanuvchi o'zbek tilida (кирилл ҳарфлар) ёзса → ўзбек тилида кирилл ҳарфларда жавоб бер
- Если пользователь пишет на русском → отвечай на русском языке
- If user writes in English → respond in English
- Boshlang'ich tahlil uchun: o'zbek tilida lotin harflarda javob ber

JAVOB FORMATI: Har bir bo'limni aniq ajrat. Markdown ishlatish mumkin. Raqamlar va foizlarni aniq ko'rsat.
Mavjud 5 ta bo'lim: Signallar, Prognoz, Tavsiyalar, Asosiy sabab tahlili, Xulosa.`;

async function analyze(req, res, next) {
  try {
    if (req.user.username !== 'admin14') {
      return res.status(403).json({ error: "Ruxsat yo'q — faqat admin14 uchun" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY sozlanmagan" });
    }

    // Gather all analytics data
    const [entriesR, topModelsR, topReasonsR, categoryR, weekR, monthR] = await Promise.all([
      db.query(`
        SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, sku, reason, category, qty, notes,
               created_at
        FROM entries ORDER BY date DESC LIMIT 1000
      `),
      db.query(`
        SELECT sku AS model, SUM(qty) AS total
        FROM entries GROUP BY sku ORDER BY total DESC LIMIT 20
      `),
      db.query(`
        SELECT reason, SUM(qty) AS total, COUNT(*) AS occurrences
        FROM entries GROUP BY reason ORDER BY total DESC LIMIT 20
      `),
      db.query(`
        SELECT category, SUM(qty) AS total FROM entries GROUP BY category ORDER BY total DESC
      `),
      db.query(`
        SELECT TO_CHAR(date,'YYYY-MM-DD') AS date, SUM(qty) AS total
        FROM entries WHERE date >= NOW() - INTERVAL '30 days'
        GROUP BY date ORDER BY date
      `),
      db.query(`
        SELECT TO_CHAR(DATE_TRUNC('month',date),'YYYY-MM') AS month, COALESCE(SUM(qty),0) AS total
        FROM entries WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month
      `),
    ]);

    const data = {
      entries:    entriesR.rows,
      topModels:  topModelsR.rows,
      topReasons: topReasonsR.rows,
      categories: categoryR.rows,
      weekData:   weekR.rows,
      monthData:  monthR.rows,
    };

    // Run statistical analysis
    const analysis = await runAnalysis(data);

    const { messages = [] } = req.body;

    // Build context summary (avoid huge payload to Claude)
    const context = {
      summary:         analysis.summary,
      signals:         analysis.signals,
      forecast:        analysis.forecast,
      recommendations: analysis.recommendations,
      rootCauses: {
        topPairs:    analysis.rootCauses.topModelReasonPairs.slice(0, 10),
        worstDay:    analysis.rootCauses.worstDayOfWeek,
        categories:  analysis.rootCauses.categories,
        monthlyTrend: analysis.rootCauses.monthlyTrend,
        peakHour:    analysis.rootCauses.peakHour,
      },
      topModels:  topModelsR.rows.slice(0, 10).map(r => ({ model: r.model, total: parseInt(r.total) })),
      topReasons: topReasonsR.rows.slice(0, 10).map(r => ({ reason: r.reason, total: parseInt(r.total), occurrences: parseInt(r.occurrences) })),
      monthlyTrend: monthR.rows.map(r => ({ month: r.month, total: parseInt(r.total) })),
    };

    const initialPrompt =
      "Yuqoridagi statistik tahlil natijalariga asoslanib, quyidagi 5 bo'lim bo'yicha professional hisobot tuzib ber:\n\n" +
      "## 🚨 Signallar\nAnomiyal holatlar, xavf signallari va ogohlantirishlarni batafsil izohlа.\n\n" +
      "## 📈 Prognoz\nStatistik model asosida keyingi 7 kunlik bashoratni izohlа. Trend va ishonch intervalini tushuntir.\n\n" +
      "## ✅ Tavsiyalar\nHar bir tavsiyani nima uchun zarurligini asoslab, amaliy qadamlar bilan tushuntir.\n\n" +
      "## 🔍 Asosiy sabab tahlili\nModel-sabab juftliklari, hafta kuni va kategoriya bo'yicha chuqur tahlil qil.\n\n" +
      "## 📋 Xulosa\nEng muhim 3 ta topilma va keyingi qadam.";

    const apiMessages = messages.length > 0
      ? messages
      : [{ role: 'user', content: initialPrompt }];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:    'claude-opus-4-8',
        max_tokens: 4096,
        system:   SYSTEM_PROMPT + '\n\nStatistik tahlil natijasi:\n' + JSON.stringify(context, null, 2),
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(502).json({ error: errBody.error?.message || 'Anthropic API xatosi' });
    }

    const result = await response.json();
    res.json({
      text:     result.content?.[0]?.text || '',
      analysis, // Full statistical analysis for frontend charts
      usage:    result.usage,
    });
  } catch (err) { next(err); }
}

module.exports = { analyze };
