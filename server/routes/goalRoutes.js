const router = require('express').Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',                   getGoals);
router.post('/',                  createGoal);
router.put('/:id',                updateGoal);
router.patch('/:id/contribute',   contributeToGoal);
router.delete('/:id',             deleteGoal);

module.exports = router;