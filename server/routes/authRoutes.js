const router = require('express').Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes — no token needed
router.post('/register', register);
router.post('/login',    login);

// Protected routes — token required
router.get('/me',              protect, getMe);
router.put('/profile',         protect, updateProfile);
router.put('/password',        protect, changePassword);
module.exports = router;