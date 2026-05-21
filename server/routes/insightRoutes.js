const router = require('express').Router();
const {
  getInsights,
  getMonthlySummary,
  getBudgetAdvice,
} = require('../controllers/insightController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/analyze',          getInsights);
router.get('/monthly-summary',   getMonthlySummary);
router.get('/budget-advice',     getBudgetAdvice);

module.exports = router;