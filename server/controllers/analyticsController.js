const { pool } = require('../config/db');

// ─── MONTHLY OVERVIEW (last 6 months) ────────────────────────────────────────
// GET /api/analytics/monthly
const getMonthlyOverview = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        TO_CHAR(date, 'Mon')                                          AS month,
        EXTRACT(MONTH FROM date)                                      AS month_num,
        EXTRACT(YEAR  FROM date)                                      AS year,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                          WHEN type = 'expense' THEN -amount END), 0) AS savings
       FROM transactions
       WHERE user_id = $1
         AND date >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
       ORDER BY year ASC, month_num ASC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: { monthly: result.rows },
    });

  } catch (error) {
    next(error);
  }
};

// ─── SPENDING BY CATEGORY ─────────────────────────────────────────────────────
// GET /api/analytics/categories
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear  = year  || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
        c.name,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0)                             AS total,
        COUNT(t.id)                                            AS count,
        ROUND(
          COALESCE(SUM(t.amount), 0) /
          NULLIF(SUM(SUM(t.amount)) OVER (), 0) * 100, 1
        )                                                      AS percentage
       FROM categories c
       LEFT JOIN transactions t
         ON t.category_id = c.id
         AND t.user_id = $1
         AND t.type = 'expense'
         AND EXTRACT(MONTH FROM t.date) = $2
         AND EXTRACT(YEAR  FROM t.date) = $3
       WHERE c.user_id = $1
         AND c.type = 'expense'
       GROUP BY c.id, c.name, c.color, c.icon
       HAVING COALESCE(SUM(t.amount), 0) > 0
       ORDER BY total DESC`,
      [req.user.id, currentMonth, currentYear]
    );

    res.status(200).json({
      success: true,
      data: { categories: result.rows },
    });

  } catch (error) {
    next(error);
  }
};

// ─── DAILY SPENDING (current month) ──────────────────────────────────────────
// GET /api/analytics/daily
const getDailySpending = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear  = year  || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
        EXTRACT(DAY FROM date)                                        AS day,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR  FROM date) = $3
       GROUP BY EXTRACT(DAY FROM date)
       ORDER BY day ASC`,
      [req.user.id, currentMonth, currentYear]
    );

    res.status(200).json({
      success: true,
      data: { daily: result.rows },
    });

  } catch (error) {
    next(error);
  }
};

// ─── MONTH VS MONTH COMPARISON ────────────────────────────────────────────────
// GET /api/analytics/comparison
const getMonthComparison = async (req, res, next) => {
  try {
    const now = new Date();
    const thisMonth  = now.getMonth() + 1;
    const thisYear   = now.getFullYear();
    const lastMonth  = thisMonth === 1 ? 12 : thisMonth - 1;
    const lastYear   = thisMonth === 1 ? thisYear - 1 : thisYear;

    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                          WHEN type = 'expense' THEN -amount END), 0)        AS savings
       FROM transactions
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR  FROM date) = $3
    `;

    const [current, previous] = await Promise.all([
      pool.query(query, [req.user.id, thisMonth, thisYear]),
      pool.query(query, [req.user.id, lastMonth, lastYear]),
    ]);

    const curr = current.rows[0];
    const prev = previous.rows[0];

    // Calculate percentage changes
    const pctChange = (curr, prev) => {
      if (Number(prev) === 0) return null;
      return Math.round(((curr - prev) / prev) * 100);
    };

    res.status(200).json({
      success: true,
      data: {
        current:  curr,
        previous: prev,
        changes: {
          income:   pctChange(curr.income,   prev.income),
          expenses: pctChange(curr.expenses, prev.expenses),
          savings:  pctChange(curr.savings,  prev.savings),
        },
      },
    });

  } catch (error) {
    next(error);
  }
};

// ─── TOP SPENDING DAYS ────────────────────────────────────────────────────────
// GET /api/analytics/top-days
const getTopSpendingDays = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        TO_CHAR(date, 'Day')          AS day_name,
        EXTRACT(DOW FROM date)        AS day_num,
        ROUND(AVG(daily_total), 2)    AS avg_spending
       FROM (
         SELECT date, SUM(amount) AS daily_total
         FROM transactions
         WHERE user_id = $1 AND type = 'expense'
         GROUP BY date
       ) AS daily
       GROUP BY TO_CHAR(date, 'Day'), EXTRACT(DOW FROM date)
       ORDER BY avg_spending DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: { topDays: result.rows },
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyOverview,
  getCategoryBreakdown,
  getDailySpending,
  getMonthComparison,
  getTopSpendingDays,
};