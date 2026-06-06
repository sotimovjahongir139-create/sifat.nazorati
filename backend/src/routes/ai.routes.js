const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { analyze } = require('../controllers/ai.controller');

router.use(requireAuth);
router.post('/analyze', analyze);

module.exports = router;
