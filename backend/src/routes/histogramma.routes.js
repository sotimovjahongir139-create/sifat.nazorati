const router      = require('express').Router();
const requireAuth = require('../middleware/auth.middleware');
const { list, create, deleteByModel, deleteAll, listGrams, addGram } = require('../controllers/histogramma.controller');

router.use(requireAuth);
router.get('/grams',    listGrams);
router.post('/grams',   addGram);
router.get('/',         list);
router.post('/',        create);
router.delete('/model', deleteByModel);
router.delete('/',      deleteAll);

module.exports = router;
