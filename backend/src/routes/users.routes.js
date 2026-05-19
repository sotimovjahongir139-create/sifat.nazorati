const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, create, remove } = require('../controllers/users.controller');

router.use(requireAuth);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat admin uchun ruxsat berilgan' });
  }
  next();
});

router.get('/',       list);
router.post('/',      create);
router.delete('/:id', remove);

module.exports = router;
