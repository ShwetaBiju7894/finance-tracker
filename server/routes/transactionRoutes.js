const router = require('express').Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

// All transaction routes are protected
router.use(protect);

router.get('/summary', getSummary);
router.get('/',        getTransactions);
router.get('/:id',     getTransaction);
router.post('/',       createTransaction);
router.put('/:id',     updateTransaction);
router.delete('/:id',  deleteTransaction);
module.exports = router;