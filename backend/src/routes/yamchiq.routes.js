const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, create, summary } = require('../controllers/yamchiq.controller');

router.use(requireAuth);
router.get('/summary', summary);
router.get('/',        list);
router.post('/',       create);

module.exports = router;
