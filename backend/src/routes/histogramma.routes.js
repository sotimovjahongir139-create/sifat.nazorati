const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, create, deleteByModel, deleteAll } = require('../controllers/histogramma.controller');

router.use(requireAuth);
router.get('/',       list);
router.post('/',      create);
router.delete('/model', deleteByModel);
router.delete('/',    deleteAll);

module.exports = router;
