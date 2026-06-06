const bcrypt = require('bcryptjs');
const db     = require('../config/database');

async function list(req, res, next) {
  try {
    const { rows } = await db.query(
      "SELECT id, username, role, created_at FROM users WHERE username <> 'admin3' ORDER BY id"
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "Username, parol va rol talab qilinadi" });
    }
    if (!['admin', 'boss', 'operator'].includes(role)) {
      return res.status(400).json({ error: "Noto'g'ri rol (admin/boss/operator)" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 ta belgidan iborat bo'lishi kerak" });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1,$2,$3)
       RETURNING id, username, role, created_at`,
      [username.trim(), hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: "Bu username allaqachon mavjud" });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });
    }
    const { rows } = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username',
      [targetId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    res.json({ deleted: rows[0].id, username: rows[0].username });
  } catch (err) { next(err); }
}

module.exports = { list, create, remove };
