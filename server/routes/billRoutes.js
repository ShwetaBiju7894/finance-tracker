const router = require('express').Router();
const {
  getBills,
  createBill,
  updateBill,
  deleteBill,
} = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',       getBills);
router.post('/',      createBill);
router.put('/:id',    updateBill);
router.delete('/:id', deleteBill);

module.exports = router;