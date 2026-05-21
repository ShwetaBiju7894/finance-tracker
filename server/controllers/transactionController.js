const { pool } = require('../config/db');

// ─── GET ALL TRANSACTIONS ─────────────────────────────────────────────────────
// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { type, category_id, start_date, end_date, search } = req.query;

    // Build query dynamically based on filters
    let query = `
      SELECT 
        t.id, t.type, t.amount, t.note, t.date, t.created_at,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;

    const params = [req.user.id];
    let paramIndex = 2;

    if (type) {
      query += ` AND t.type = $${paramIndex++}`;
      params.push(type);
    }

    if (category_id) {
      query += ` AND t.category_id = $${paramIndex++}`;
      params.push(category_id);
    }

    if (start_date) {
      query += ` AND t.date >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND t.date <= $${paramIndex++}`;
      params.push(end_date);
    }

    if (search) {
      query += ` AND t.note ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: { transactions: result.rows },
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET SINGLE TRANSACTION ───────────────────────────────────────────────────
// GET /api/transactions/:id
const getTransaction = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.id, t.type, t.amount, t.note, t.date, t.created_at,
        c.name AS category_name,
        c.color AS category_color,
        c.icon AS category_icon
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { transaction: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// ─── CREATE TRANSACTION ───────────────────────────────────────────────────────
// POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category_id, note, date } = req.body;

    // Validate input
    if (!type || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, amount and date',
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be income or expense',
      });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category_id, note, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, type, amount, category_id || null, note || null, date]
    );

    // If it's income and linked to a goal, update goal progress
    if (type === 'income' && req.body.goal_id) {
      await pool.query(
        `UPDATE goals 
         SET current_amount = current_amount + $1
         WHERE id = $2 AND user_id = $3`,
        [amount, req.body.goal_id, req.user.id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: { transaction: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE TRANSACTION ───────────────────────────────────────────────────────
// PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const { type, amount, category_id, note, date } = req.body;

    // Check transaction exists and belongs to user
    const existing = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, amount = $2, category_id = $3, note = $4, date = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [type, amount, category_id || null, note || null, date, req.params.id, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// ─── DELETE TRANSACTION ───────────────────────────────────────────────────────
// DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET SUMMARY ──────────────────────────────────────────────────────────────
// GET /api/transactions/summary
const getSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear  = year  || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                          WHEN type = 'expense' THEN -amount
                          ELSE 0 END), 0) AS net_savings,
        COUNT(*) AS transaction_count
       FROM transactions
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR  FROM date) = $3`,
      [req.user.id, currentMonth, currentYear]
    );

    res.status(200).json({
      success: true,
      data: { summary: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
};