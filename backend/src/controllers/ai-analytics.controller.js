'use strict';

const { GoogleGenerativeAI }                        = require('@google/generative-ai');
const db                                            = require('../config/database');
const { runAnalysis }                               = require('../analytics/services/ai_engine');
const { checkAI, getApiKey, aiStatus, toGeminiHistory } = require('../analytics/services/config');

const SYSTEM_INSTRUCTION =
  "Sen sifat nazorati bo'yicha mutaxassis data-analitiksan. Senga real fabrika ishlab chiqarish ma'lumotlari va statistik tahlil natijalari beriladi.\n\n" +
  "TIL QO'LLASH (MAJBURIY):\n" +
  "- Foydalanuvchi o'zbek tilida (lotin) yozsa → o'zbek tilida lotin harflarda javob ber\n" +
  "- Foydalanuvchi o'zbek tilida (кирилл) ёзса → ўзбек тилида кирилл ҳарфларда жавоб бер\n" +
  "- Если пользователь пишет на русском → отвечай на русском языке\n" +
  "- If user writes in English → respond in English\n" +
  "- Boshlang'ich tahlil uchun: o'zbek tilida lotin harflarda javob ber\n\n" +
  "JAVOB FORMATI: Har bir bo'limni ## sarlavha bilan ajrat. Raqamlar va foizlarni aniq ko'rsat.";

async function analyze(req, res, next) {
  try {
    if (req.user.username !== 'admin14') {
      return res.status(403).json({ error: "Ruxsat yo'q — faqat admin14 uchun" });
    }

    const aiCheck = checkAI();
    if (!aiCheck.ok) {
      return res.status(aiCheck.status).json({ error: aiCheck.error });
    }

    // ── EXACT SAME date helpers as stats.controller ────────────────────────
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // ── ALL QUERIES IN PARALLEL — exact copies from stats + defects controllers ──
    const [
      todayR, monthR, topModelMonthR, topReasonR, trendR,
      topModelsR, topReasonsR, entriesR, categoryR, histR,
    ] = await Promise.all([
      db.query(
        'SELECT COALESCE(SUM(qty),0) AS total FROM entries WHERE date=$1',
        [today]
      ),
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
         FROM entries WHERE date >= NOW() - INTERVAL '6 months'
         GROUP BY month ORDER BY month`
      ),
      db.query(
        `SELECT sku AS name, SUM(qty) AS total
         FROM entries GROUP BY sku ORDER BY total DESC LIMIT 10`
      ),
      db.query(
        `SELECT reason, SUM(qty) AS total, COUNT(*) AS occurrences
         FROM entries GROUP BY reason ORDER BY total DESC LIMIT 20`
      ),
      db.query(
        `SELECT e.id,
                TO_CHAR(e.date,'YYYY-MM-DD') AS date,
                e.sku, e.reason,
                e.category AS cat,
                e.qty, e.notes,
                e.created_at,
                u.username AS created_by_name
         FROM entries e
         LEFT JOIN users u ON e.created_by = u.id
         ORDER BY e.created_at DESC
         LIMIT 5000`
      ),
      db.query(
        `SELECT category, SUM(qty) AS total
         FROM entries GROUP BY category ORDER BY total DESC`
      ),
      db.query(
        `SELECT q.id,
                TO_CHAR(q.date,'YYYY-MM-DD') AS date,
                q.material_type, q.model, q.gram, q.qty,
                u.username AS created_by_name
         FROM quality_records q
         LEFT JOIN users u ON q.created_by = u.id
         ORDER BY q.created_at DESC
         LIMIT 2000`
      ),
    ]);

    // Normalise entries
    const entries = entriesR.rows.map(e => ({
      ...e,
      model:    e.sku,
      category: e.cat,
    }));

    // Normalise topModels: stats.controller returns `name`, signals.js expects `model`
    const topModels = topModelsR.rows.map(r => ({
      model: r.name,
      sku:   r.name,
      total: parseInt(r.total),
    }));

    const topReasons = topReasonsR.rows.map(r => ({
      reason:      r.reason,
      total:       parseInt(r.total),
      occurrences: parseInt(r.occurrences),
    }));

    const categories = categoryR.rows.map(r => ({
      category: r.category,
      total:    parseInt(r.total),
    }));

    // ── STATISTICAL ANALYSIS ───────────────────────────────────────────────
    const analysis = await runAnalysis({ entries, topModels, topReasons, categories });

    // Inject dashboard numbers so summary exactly matches dashboard
    analysis.summary.today_total  = parseInt(todayR.rows[0].total);
    analysis.summary.month_total  = parseInt(monthR.rows[0].total);
    analysis.summary.top_model    = topModelMonthR.rows[0]?.sku   || null;
    analysis.summary.top_reason   = topReasonR.rows[0]?.reason    || null;
    analysis.summary.trend_6mo    = trendR.rows.map(r => ({ month: r.month, total: parseInt(r.total) }));
    analysis.summary.hist_records = histR.rows.length;
    analysis.summary.hist_pu      = histR.rows.filter(r => r.material_type === 'PU').reduce((s, r) => s + parseInt(r.qty || 0), 0);
    analysis.summary.hist_tep     = histR.rows.filter(r => r.material_type === 'TEP').reduce((s, r) => s + parseInt(r.qty || 0), 0);

    const { messages = [] } = req.body;

    const context = {
      dashboard_exact: {
        today_defects:        analysis.summary.today_total,
        this_month_defects:   analysis.summary.month_total,
        top_model_this_month: analysis.summary.top_model,
        top_defect_reason:    analysis.summary.top_reason,
        trend_6_months:       analysis.summary.trend_6mo,
      },
      top10_models:   topModels.slice(0, 10),
      top_reasons:    topReasons.slice(0, 10),
      categories,
      histogramma: {
        total_records: analysis.summary.hist_records,
        PU_qty:        analysis.summary.hist_pu,
        TEP_qty:       analysis.summary.hist_tep,
      },
      statistical_analysis: {
        signals:         analysis.signals,
        forecast:        analysis.forecast,
        recommendations: analysis.recommendations,
        root_causes: {
          top_model_reason_pairs: analysis.rootCauses.topModelReasonPairs.slice(0, 10),
          worst_day_of_week:      analysis.rootCauses.worstDayOfWeek,
          category_breakdown:     analysis.rootCauses.categories,
          monthly_trend:          analysis.rootCauses.monthlyTrend,
          peak_hour:              analysis.rootCauses.peakHour,
        },
      },
      summary: analysis.summary,
    };

    const systemWithContext =
      SYSTEM_INSTRUCTION + '\n\nStatistik ma\'lumotlar:\n' + JSON.stringify(context, null, 2);

    const initialPrompt =
      `Dashboard ma'lumotlari:\n` +
      `- Bugungi brak: ${analysis.summary.today_total} ta\n` +
      `- Bu oyda jami: ${analysis.summary.month_total} ta\n` +
      `- Eng muammoli model: ${analysis.summary.top_model || '—'}\n` +
      `- Eng ko'p sabab: ${analysis.summary.top_reason || '—'}\n\n` +
      `Yuqoridagi to'liq statistik tahlilga asoslanib, quyidagi bo'limlar bo'yicha professional hisobot tuzib ber:\n\n` +
      `## 🚨 Signallar\nAnomiyal holatlar, xavf signallari va ogohlantirishlarni batafsil izohla.\n\n` +
      `## 📈 Prognoz\nStatistik model asosida keyingi 7 kunlik bashoratni izohla.\n\n` +
      `## ✅ Tavsiyalar\nHar bir tavsiyani amaliy qadamlar bilan tushuntir.\n\n` +
      `## 🔍 Asosiy sabab tahlili\nModel-sabab juftliklari va hafta kuni bo'yicha chuqur tahlil.\n\n` +
      `## 📋 Xulosa\nEng muhim 3 ta topilma va keyingi qadam.`;

    let responseText;
    try {
      const genAI = new GoogleGenerativeAI(getApiKey());
      const model = genAI.getGenerativeModel({
        model:             'gemini-2.5-flash',
        systemInstruction: systemWithContext,
      });

      if (messages.length > 0) {
        const history = toGeminiHistory(messages.slice(0, -1));
        const lastMsg = messages[messages.length - 1].content;
        const chat    = model.startChat({ history });
        const result  = await chat.sendMessage(lastMsg);
        responseText  = result.response.text();
      } else {
        const result = await model.generateContent(initialPrompt);
        responseText = result.response.text();
      }
    } catch (aiErr) {
      const msg = aiErr.message || '';
      if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) {
        return res.status(503).json({ error: "AI xizmati vaqtincha mavjud emas — API kalit tekshiruvi muvaffaqiyatsiz." });
      }
      return res.status(503).json({ error: "AI xizmati vaqtincha mavjud emas. Administrator bilan bog'laning." });
    }

    res.json({ text: responseText, analysis });
  } catch (err) { next(err); }
}

async function status(req, res) {
  if (req.user.username !== 'admin14') {
    return res.status(403).json({ error: "Ruxsat yo'q" });
  }
  res.json(aiStatus());
}

module.exports = { analyze, status };
