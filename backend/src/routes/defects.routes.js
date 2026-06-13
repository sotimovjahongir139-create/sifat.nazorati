const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, create, remove, modelCauses, categoryModels, weeklySummary } = require('../controllers/defects.controller');

router.use(requireAuth);
router.get('/model-causes',    modelCauses);
router.get('/category-models', categoryModels);
router.get('/weekly-summary',  weeklySummary);
router.get('/',    list);
router.post('/',   create);
router.delete('/:id', remove);

module.exports = router;
