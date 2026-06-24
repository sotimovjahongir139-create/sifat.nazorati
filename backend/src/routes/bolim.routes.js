const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, upsert } = require('../controllers/bolim.controller');

router.use(requireAuth);
router.get('/',  list);
router.post('/', upsert);

module.exports = router;
