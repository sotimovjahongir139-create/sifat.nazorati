const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { analyze, status } = require('../controllers/ai-analytics.controller');
const { logStartup }      = require('../analytics/services/config');

// Log AI key presence once when routes are registered (server startup)
logStartup();

router.use(requireAuth);
router.get('/status',  status);
router.post('/analyze', analyze);

module.exports = router;
