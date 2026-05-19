const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list }    = require('../controllers/models.controller');

router.use(requireAuth);
router.get('/', list);

module.exports = router;
