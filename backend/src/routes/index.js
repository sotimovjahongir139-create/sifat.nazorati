const router = require('express').Router();

router.use('/auth',      require('./auth.routes'));
router.use('/defects',   require('./defects.routes'));
router.use('/entries',   require('./defects.routes'));   // backward compat
router.use('/models',    require('./models.routes'));
router.use('/stats',     require('./stats.routes'));
router.use('/analytics', require('./stats.routes'));     // backward compat
router.use('/users',     require('./users.routes'));
router.use('/reasons',      require('./reasons.routes'));
router.use('/histogramma', require('./histogramma.routes'));

router.get('/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

module.exports = router;
