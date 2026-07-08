const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { receive, monthlyFoiz } = require('../controllers/fakt.controller');

router.post('/receive',      receive);           // API key checked inside controller
router.get('/monthly-foiz',  requireAuth, monthlyFoiz);

module.exports = router;
