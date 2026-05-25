const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, create } = require('../controllers/reasons.controller');

router.use(requireAuth);
router.get('/',  list);
router.post('/', create);

module.exports = router;
