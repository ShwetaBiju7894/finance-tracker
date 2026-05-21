const { pool } = require('../config/db');

// ─── Helper: days until next due date ────────────────────────────────────────
const getDaysUntilDue = (dueDay) => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let dueDate = new Date(currentYear, currentMonth, dueDay);

  // If due date already passed this month, next due is next month
  if (dueDay < currentDay) {
    dueDate = new Date(currentYear, currentMonth + 1, dueDay);
  }

  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// ─── GET ALL BILLS ────────────────────────────────────────────────────────────
// GET /api/bills
const getBills = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bills
       WHERE user_id = $1
       ORDER BY due_date ASC`,
      [req.user.id]
    );

    // Add days_until_due to each bill dynamically
    const bills = result.rows.map((bill) => ({
      ...bill,
      days_until_due: getDaysUntilDue(bill.due_date),
    }));

    res.status(200).json({
      success: true,
      data: { bills },
    });

  } catch (error) {
    next(error);
  }
};

// ─── CREATE BILL ──────────────────────────────────────────────────────────────
// POST /api/bills
const createBill = async (req, res, next) => {
  try {
    const { name, amount, due_date, is_recurring, remind_days, email_remind } = req.body;

    if (!name || !amount || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, amount and due date',
      });
    }

    if (due_date < 1 || due_date > 31) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be between 1 and 31',
      });
    }

    const result = await pool.query(
      `INSERT INTO bills (user_id, name, amount, due_date, is_recurring, remind_days, email_remind)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        name,
        amount,
        due_date,
        is_recurring  !== undefined ? is_recurring  : true,
        remind_days   !== undefined ? remind_days   : 3,
        email_remind  !== undefined ? email_remind  : true,
      ]
    );

    const bill = {
      ...result.rows[0],
      days_until_due: getDaysUntilDue(result.rows[0].due_date),
    };

    res.status(201).json({
      success: true,
      message: 'Bill added successfully',
      data: { bill },
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE BILL ──────────────────────────────────────────────────────────────
// PUT /api/bills/:id
const updateBill = async (req, res, next) => {
  try {
    const { name, amount, due_date, is_recurring, remind_days, email_remind } = req.body;

    const existing = await pool.query(
      'SELECT id FROM bills WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    const result = await pool.query(
      `UPDATE bills
       SET name = $1, amount = $2, due_date = $3,
           is_recurring = $4, remind_days = $5, email_remind = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, amount, due_date, is_recurring, remind_days, email_remind,
       req.params.id, req.user.id]
    );

    const bill = {
      ...result.rows[0],
      days_until_due: getDaysUntilDue(result.rows[0].due_date),
    };

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: { bill },
    });

  } catch (error) {
    next(error);
  }
};

// ─── DELETE BILL ──────────────────────────────────────────────────────────────
// DELETE /api/bills/:id
const deleteBill = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM bills WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getBills, createBill, updateBill, deleteBill };