const router = require('express').Router();
const {
  getMonthlyOverview,
  getCategoryBreakdown,
  getDailySpending,
  getMonthComparison,
  getTopSpendingDays,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/monthly',    getMonthlyOverview);
router.get('/categories', getCategoryBreakdown);
router.get('/daily',      getDailySpending);
router.get('/comparison', getMonthComparison);
router.get('/top-days',   getTopSpendingDays);

module.exports = router;