const db = require('../config/database');

const VALID_MATERIALS = ['PU', 'TEP'];

async function list(req, res, next) {
  try {
    const { material_type } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (material_type) {
      where += ` AND q.material_type = $${idx++}`;
      params.push(material_type);
    }

    const sql = `
      SELECT q.id,
             TO_CHAR(q.date,'YYYY-MM-DD') AS date,
             q.material_type, q.model, q.gram, q.qty,
             q.created_at,
             u.username AS created_by_name
      FROM quality_records q
      LEFT JOIN users u ON q.created_by = u.id
      ${where}
      ORDER BY q.created_at DESC
      LIMIT 5000
    `;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { date, material_type, model, gram = '', qty, gramm } = req.body;
    if (!date || !material_type || !model || !qty) {
      return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
    }
    if (!VALID_MATERIALS.includes(material_type)) {
      return res.status(400).json({ error: "Noto'g'ri material turi" });
    }
    const qtyInt = parseInt(qty);
    if (isNaN(qtyInt) || qtyInt < 1) {
      return res.status(400).json({ error: "Miqdor 1 dan katta bo'lishi kerak" });
    }
    const grammInt = (gramm !== undefined && gramm !== null && gramm !== '') ? parseInt(gramm) : null;
    const effectiveGramm = grammInt !== null ? grammInt
      : (gram && !isNaN(parseInt(gram)) ? parseInt(gram) : null);

    if (req.user.username !== 'admin2' && effectiveGramm !== null) {
      const { rows: rr } = await db.query(
        `SELECT min_gram, max_gram FROM model_grams WHERE material_type=$1 AND model=$2`,
        [material_type, model.trim()]
      );
      if (!rr.length) return res.status(400).json({ error: "Bu model uchun gramm diapazoni aniqlanmagan" });
      if (effectiveGramm < rr[0].min_gram || effectiveGramm > rr[0].max_gram)
        return res.status(400).json({ error: `Gramm ${rr[0].min_gram}–${rr[0].max_gram} orasida bo'lishi kerak` });
    }

    const { rows } = await db.query(
      `INSERT INTO quality_records (date, material_type, model, gram, qty, gramm, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, TO_CHAR(date,'YYYY-MM-DD') AS date, material_type, model, gram, qty, gramm, created_at`,
      [date, material_type, model.trim(), String(gram).trim(), qtyInt, effectiveGramm, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function listGrams(req, res, next) {
  try {
    const { material_type, model } = req.query;
    if (!material_type) return res.status(400).json({ error: 'material_type kerak' });
    const params = [material_type];
    let sql = `SELECT model, min_gram, max_gram, sizes FROM model_grams WHERE material_type=$1`;
    if (model) { sql += ` AND model=$2`; params.push(model.trim()); }
    sql += ` ORDER BY model ASC`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

async function addGram(req, res, next) {
  try {
    if (req.user.username !== 'admin2') return res.status(403).json({ error: "Ruxsat yo'q" });
    const { material_type, model, min_gram, max_gram, sizes = '' } = req.body;
    if (!material_type || !model || min_gram == null || max_gram == null)
      return res.status(400).json({ error: 'Barcha maydonlar kerak' });
    if (!VALID_MATERIALS.includes(material_type))
      return res.status(400).json({ error: "Noto'g'ri material turi" });
    const minInt = parseInt(min_gram), maxInt = parseInt(max_gram);
    if (isNaN(minInt) || minInt <= 0)
      return res.status(400).json({ error: "Min gramm 0 dan katta bo'lishi kerak" });
    if (isNaN(maxInt) || maxInt < minInt)
      return res.status(400).json({ error: "Max gramm min grammdan katta yoki teng bo'lishi kerak" });
    const sizesStr = String(sizes || '').trim();
    await db.query(
      `INSERT INTO model_grams (material_type, model, min_gram, max_gram, sizes) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (material_type, model) DO UPDATE SET min_gram=$3, max_gram=$4, sizes=$5`,
      [material_type, model.trim(), minInt, maxInt, sizesStr]
    );
    res.status(201).json({ ok: true, min_gram: minInt, max_gram: maxInt, sizes: sizesStr });
  } catch (err) { next(err); }
}

async function deleteByModel(req, res, next) {
  try {
    if (req.user.username !== 'admin2') {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }
    const { material_type, model } = req.query;
    if (!material_type || !model) {
      return res.status(400).json({ error: "material_type va model kerak" });
    }
    await db.query(
      'DELETE FROM quality_records WHERE material_type = $1 AND model = $2',
      [material_type, model.trim()]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function deleteAll(req, res, next) {
  try {
    if (!['admin2', 'admin'].includes(req.user.username)) {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }
    await db.query('DELETE FROM quality_records');
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function listSizeGrams(req, res, next) {
  try {
    const { material_type } = req.query;
    if (!material_type) return res.status(400).json({ error: 'material_type kerak' });
    const { rows } = await db.query(
      `SELECT model, size, min_gram, max_gram FROM model_size_grams WHERE material_type=$1 ORDER BY model ASC, size ASC`,
      [material_type]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function saveSizeGrams(req, res, next) {
  try {
    if (req.user.username !== 'admin2') return res.status(403).json({ error: "Ruxsat yo'q" });
    const { material_type, model, sizes } = req.body;
    if (!material_type || !model || !Array.isArray(sizes) || !sizes.length)
      return res.status(400).json({ error: 'Barcha maydonlar kerak' });
    if (!VALID_MATERIALS.includes(material_type))
      return res.status(400).json({ error: "Noto'g'ri material turi" });
    for (const s of sizes) {
      const sInt = parseInt(s.size), minInt = parseInt(s.min_gram), maxInt = parseInt(s.max_gram);
      if (isNaN(sInt) || sInt < 35 || sInt > 47)
        return res.status(400).json({ error: `Noto'g'ri razmer: ${s.size}` });
      if (isNaN(minInt) || minInt <= 0)
        return res.status(400).json({ error: `Razmer ${sInt}: min gramm 0 dan katta bo'lishi kerak` });
      if (isNaN(maxInt) || maxInt < minInt)
        return res.status(400).json({ error: `Razmer ${sInt}: max gramm min grammdan katta bo'lishi kerak` });
    }
    await db.query(`DELETE FROM model_size_grams WHERE material_type=$1 AND model=$2`, [material_type, model.trim()]);
    for (const s of sizes) {
      await db.query(
        `INSERT INTO model_size_grams (material_type, model, size, min_gram, max_gram) VALUES ($1,$2,$3,$4,$5)`,
        [material_type, model.trim(), parseInt(s.size), parseInt(s.min_gram), parseInt(s.max_gram)]
      );
    }
    // Keep model_grams in sync (overall range) for non-admin2 gramm picker
    const overallMin = Math.min(...sizes.map(s => parseInt(s.min_gram)));
    const overallMax = Math.max(...sizes.map(s => parseInt(s.max_gram)));
    await db.query(
      `INSERT INTO model_grams (material_type, model, min_gram, max_gram) VALUES ($1,$2,$3,$4)
       ON CONFLICT (material_type, model) DO UPDATE SET min_gram=$3, max_gram=$4`,
      [material_type, model.trim(), overallMin, overallMax]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, deleteByModel, deleteAll, listGrams, addGram, listSizeGrams, saveSizeGrams };
