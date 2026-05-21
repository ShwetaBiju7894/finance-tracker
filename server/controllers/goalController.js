const { pool } = require('../config/db');

// ─── GET ALL GOALS ────────────────────────────────────────────────────────────
// GET /api/goals
const getGoals = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        *,
        ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS percentage
       FROM goals
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: { goals: result.rows },
    });

  } catch (error) {
    next(error);
  }
};

// ─── CREATE GOAL ──────────────────────────────────────────────────────────────
// POST /api/goals
const createGoal = async (req, res, next) => {
  try {
    const { title, target_amount, current_amount, deadline, icon, color } = req.body;

    if (!title || !target_amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and target amount',
      });
    }

    if (isNaN(target_amount) || Number(target_amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be a positive number',
      });
    }

    const result = await pool.query(
      `INSERT INTO goals 
        (user_id, title, target_amount, current_amount, deadline, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *,
         ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS percentage`,
      [
        req.user.id,
        title,
        target_amount,
        current_amount || 0,
        deadline || null,
        icon  || 'target',
        color || '#1D9E75',
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: { goal: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE GOAL ──────────────────────────────────────────────────────────────
// PUT /api/goals/:id
const updateGoal = async (req, res, next) => {
  try {
    const { title, target_amount, current_amount, deadline, icon, color } = req.body;

    const existing = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    const result = await pool.query(
      `UPDATE goals
       SET title = $1, target_amount = $2, current_amount = $3,
           deadline = $4, icon = $5, color = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *,
         ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS percentage`,
      [
        title,
        target_amount,
        current_amount,
        deadline || null,
        icon  || 'target',
        color || '#1D9E75',
        req.params.id,
        req.user.id,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: { goal: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// ─── ADD TO GOAL AMOUNT ───────────────────────────────────────────────────────
// PATCH /api/goals/:id/contribute
const contributeToGoal = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount',
      });
    }

    const result = await pool.query(
      `UPDATE goals
       SET current_amount = LEAST(current_amount + $1, target_amount)
       WHERE id = $2 AND user_id = $3
       RETURNING *,
         ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS percentage`,
      [amount, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    const goal = result.rows[0];
    const isComplete = Number(goal.percentage) >= 100;

    res.status(200).json({
      success: true,
      message: isComplete ? '🎉 Goal completed!' : 'Contribution added successfully',
      data: { goal },
    });

  } catch (error) {
    next(error);
  }
};

// ─── DELETE GOAL ──────────────────────────────────────────────────────────────
// DELETE /api/goals/:id
const deleteGoal = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal,
};