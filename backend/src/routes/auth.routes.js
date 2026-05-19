const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { login, me } = require('../controllers/auth.controller');

router.post('/login', login);
router.get('/me', requireAuth, me);

module.exports = router;
