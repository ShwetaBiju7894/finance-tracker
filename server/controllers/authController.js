const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// ─── Helper: generate JWT token ───────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // token expires in 7 days
  );
};

// ─── Helper: create default categories for new users ─────────────────────────
const createDefaultCategories = async (userId) => {
  const defaults = [
    { name: 'Salary',        color: '#1D9E75', icon: 'briefcase',     type: 'income'  },
    { name: 'Freelance',     color: '#378ADD', icon: 'laptop',        type: 'income'  },
    { name: 'Investment',    color: '#7F77DD', icon: 'trending-up',   type: 'income'  },
    { name: 'Housing',       color: '#EF9F27', icon: 'home',          type: 'expense' },
    { name: 'Food',          color: '#1D9E75', icon: 'shopping-cart', type: 'expense' },
    { name: 'Transport',     color: '#378ADD', icon: 'car',           type: 'expense' },
    { name: 'Entertainment', color: '#7F77DD', icon: 'device-tv',     type: 'expense' },
    { name: 'Health',        color: '#E24B4A', icon: 'heart',         type: 'expense' },
    { name: 'Shopping',      color: '#EF9F27', icon: 'bag',           type: 'expense' },
    { name: 'Utilities',     color: '#534AB7', icon: 'bolt',          type: 'expense' },
  ];

  for (const cat of defaults) {
    await pool.query(
      `INSERT INTO categories (user_id, name, color, icon, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, cat.name, cat.color, cat.icon, cat.type]
    );
  }
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // 2. Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // 3. Hash the password — never store plain text passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save user to database
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];

    // 5. Create default categories for this user
    await createDefaultCategories(user.id);

    // 6. Generate token and respond
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token },
    });

  } catch (error) {
    next(error); // pass to global error handler
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // 2. Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // 3. Compare password with hashed version
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. Generate token and respond
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id:         user.id,
          name:       user.name,
          email:      user.email,
          created_at: user.created_at,
        },
        token,
      },
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: { user: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
// PUT /api/auth/profile  (protected)
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email',
      });
    }

    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2
       WHERE id = $3
       RETURNING id, name, email, created_at`,
      [name, email.toLowerCase(), req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
// PUT /api/auth/password  (protected)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Get user with password
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };