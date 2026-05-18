const router      = require('express').Router();
const bcrypt      = require('bcryptjs');
const db          = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat admin uchun ruxsat berilgan' });
  }
  next();
}
router.use(adminOnly);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, role, created_at FROM users ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
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
    console.error('POST /users error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
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
  } catch (err) {
    console.error('DELETE /users error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
