const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, create, deleteAll } = require('../controllers/histogramma.controller');

router.use(requireAuth);
router.get('/',    list);
router.post('/',   create);
router.delete('/', deleteAll);

module.exports = router;
