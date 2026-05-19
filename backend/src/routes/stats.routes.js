const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { dashboard, topModels } = require('../controllers/stats.controller');

router.use(requireAuth);
router.get('/dashboard',  dashboard);
router.get('/top-models', topModels);

module.exports = router;
