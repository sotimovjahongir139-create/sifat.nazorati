'use strict';

const db                               = require('../config/database');
const { runAnalysis }                  = require('../analytics/services/ai_engine');
const { checkAI, getApiKey, aiStatus } = require('../analytics/services/config');

const SYSTEM_PROMPT =
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
    const apiKey = getApiKey();

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
      // stats.controller.dashboard() — today total
      db.query(
        'SELECT COALESCE(SUM(qty),0) AS total FROM entries WHERE date=$1',
        [today]
      ),
      // stats.controller.dashboard() — this month total
      db.query(
        `SELECT COALESCE(SUM(qty),0) AS total FROM entries
         WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2`,
        [year, month]
      ),
      // stats.controller.dashboard() — top model this month
      db.query(
        `SELECT sku, SUM(qty) AS total FROM entries
         WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2
         GROUP BY sku ORDER BY total DESC LIMIT 1`,
        [year, month]
      ),
      // stats.controller.dashboard() — top reason all-time
      db.query(
        `SELECT reason, SUM(qty) AS total FROM entries
         GROUP BY reason ORDER BY total DESC LIMIT 1`
      ),
      // stats.controller.dashboard() — 6-month trend
      db.query(
        `SELECT TO_CHAR(DATE_TRUNC('month',date),'YYYY-MM') AS month,
                COALESCE(SUM(qty),0) AS total
         FROM entries WHERE date >= NOW() - INTERVAL '6 months'
         GROUP BY month ORDER BY month`
      ),
      // stats.controller.topModels() — exact query
      db.query(
        `SELECT sku AS name, SUM(qty) AS total
         FROM entries GROUP BY sku ORDER BY total DESC LIMIT 10`
      ),
      // all reasons with counts
      db.query(
        `SELECT reason, SUM(qty) AS total, COUNT(*) AS occurrences
         FROM entries GROUP BY reason ORDER BY total DESC LIMIT 20`
      ),
      // defects.controller.list() — same SQL, no privilege filter (admin14 sees all), same LIMIT
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
      // category breakdown
      db.query(
        `SELECT category, SUM(qty) AS total
         FROM entries GROUP BY category ORDER BY total DESC`
      ),
      // histogramma (quality_records) — same as histogramma.controller.list()
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

    // Normalise entries: use `sku` from entries table, expose as both `sku` and `model`
    const entries = entriesR.rows.map(e => ({
      ...e,
      model:    e.sku,        // alias for analysis modules
      category: e.cat,        // alias for rootcause
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

    const data = { entries, topModels, topReasons, categories };

    // ── STATISTICAL ANALYSIS ───────────────────────────────────────────────
    const analysis = await runAnalysis(data);

    // Inject the dashboard numbers so summary exactly matches dashboard
    analysis.summary.today_total  = parseInt(todayR.rows[0].total);
    analysis.summary.month_total  = parseInt(monthR.rows[0].total);
    analysis.summary.top_model    = topModelMonthR.rows[0]?.sku   || null;
    analysis.summary.top_reason   = topReasonR.rows[0]?.reason    || null;
    analysis.summary.trend_6mo    = trendR.rows.map(r => ({ month: r.month, total: parseInt(r.total) }));
    analysis.summary.hist_records = histR.rows.length;
    analysis.summary.hist_pu      = histR.rows.filter(r => r.material_type === 'PU').reduce((s, r) => s + parseInt(r.qty || 0), 0);
    analysis.summary.hist_tep     = histR.rows.filter(r => r.material_type === 'TEP').reduce((s, r) => s + parseInt(r.qty || 0), 0);

    const { messages = [] } = req.body;

    // ── CONTEXT FOR CLAUDE ─────────────────────────────────────────────────
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

    const initialPrompt =
      `Dashboard ma'lumotlari:\n` +
      `- Bugungi brak: ${analysis.summary.today_total} ta\n` +
      `- Bu oyda jami: ${analysis.summary.month_total} ta\n` +
      `- Eng muammoli model: ${analysis.summary.top_model || '—'}\n` +
      `- Eng ko'p sabab: ${analysis.summary.top_reason || '—'}\n\n` +
      `Yuqoridagi to'liq statistik tahlilga asoslanib, quyidagi bo'limlar bo'yicha professional hisobot tuzib ber:\n\n` +
      `## 🚨 Signallar\nAnomiyal holatlar, xavf signallari va ogohlantirishlarni batafsil izohlа.\n\n` +
      `## 📈 Prognoz\nStatistik model asosida keyingi 7 kunlik bashoratni izohlа.\n\n` +
      `## ✅ Tavsiyalar\nHar bir tavsiyani amaliy qadamlar bilan tushuntir.\n\n` +
      `## 🔍 Asosiy sabab tahlili\nModel-sabab juftliklari va hafta kuni bo'yicha chuqur tahlil.\n\n` +
      `## 📋 Xulosa\nEng muhim 3 ta topilma va keyingi qadam.`;

    const apiMessages = messages.length > 0
      ? messages
      : [{ role: 'user', content: initialPrompt }];

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'content-type':      'application/json',
        },
        body: JSON.stringify({
          model:      'claude-opus-4-8',
          max_tokens: 4096,
          system:     SYSTEM_PROMPT + '\n\nStatistik ma\'lumotlar:\n' + JSON.stringify(context, null, 2),
          messages:   apiMessages,
        }),
      });
    } catch (_fetchErr) {
      return res.status(503).json({ error: "AI xizmati vaqtincha mavjud emas. Administrator bilan bog'laning." });
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg     = errBody.error?.message || '';
      const status  = response.status === 401 || response.status === 403 ? 503 : 502;
      return res.status(status).json({ error: msg || "AI xizmati vaqtincha mavjud emas. Administrator bilan bog'laning." });
    }

    const result = await response.json();
    res.json({
      text:     result.content?.[0]?.text || '',
      analysis,
      usage:    result.usage,
    });
  } catch (err) { next(err); }
}

async function status(req, res) {
  if (req.user.username !== 'admin14') {
    return res.status(403).json({ error: "Ruxsat yo'q" });
  }
  res.json(aiStatus());
}

module.exports = { analyze, status };
