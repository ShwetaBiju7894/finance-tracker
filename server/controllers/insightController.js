const { pool } = require('../config/db');
const aiService = require('../services/aiService');

// ─── GET AI INSIGHTS ──────────────────────────────────────────────────────────
// POST /api/insights/analyze
const getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const month  = new Date().getMonth() + 1;
    const year   = new Date().getFullYear();

    // Fetch all data needed for analysis in parallel
    const [transactionsResult, summaryResult, categoriesResult, goalsResult] =
      await Promise.all([
        pool.query(
          `SELECT t.*, c.name AS category_name
           FROM transactions t
           LEFT JOIN categories c ON t.category_id = c.id
           WHERE t.user_id = $1
           ORDER BY t.date DESC LIMIT 20`,
          [userId]
        ),
        pool.query(
          `SELECT
            COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END),0) AS total_income,
            COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS total_expenses,
            COALESCE(SUM(CASE WHEN type='income'  THEN amount
                              WHEN type='expense' THEN -amount END),0)        AS net_savings
           FROM transactions
           WHERE user_id = $1
             AND EXTRACT(MONTH FROM date) = $2
             AND EXTRACT(YEAR  FROM date) = $3`,
          [userId, month, year]
        ),
        pool.query(
          `SELECT c.name, c.color, COALESCE(SUM(t.amount),0) AS total,
            ROUND(COALESCE(SUM(t.amount),0) /
              NULLIF(SUM(SUM(t.amount)) OVER (),0)*100,1) AS percentage
           FROM categories c
           LEFT JOIN transactions t ON t.category_id=c.id AND t.user_id=$1
             AND t.type='expense'
             AND EXTRACT(MONTH FROM t.date)=$2
             AND EXTRACT(YEAR  FROM t.date)=$3
           WHERE c.user_id=$1 AND c.type='expense'
           GROUP BY c.id,c.name,c.color
           HAVING COALESCE(SUM(t.amount),0)>0
           ORDER BY total DESC`,
          [userId, month, year]
        ),
        pool.query(
          `SELECT title, target_amount, current_amount,
            ROUND(current_amount/NULLIF(target_amount,0)*100,1) AS percentage
           FROM goals WHERE user_id=$1`,
          [userId]
        ),
      ]);

    // Check if user has enough data for meaningful insights
    if (transactionsResult.rows.length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          insights: [{
            type:    'tip',
            title:   'Add more transactions',
            message: 'Add at least a few transactions so the AI can analyze your spending patterns and give you personalized insights.',
          }],
        },
      });
    }

    // Call AI service
    const result = await aiService.analyzeSpending({
      transactions: transactionsResult.rows,
      summary:      summaryResult.rows[0],
      categories:   categoriesResult.rows,
      goals:        goalsResult.rows,
    });

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET MONTHLY SUMMARY ──────────────────────────────────────────────────────
// GET /api/insights/monthly-summary
const getMonthlySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const month  = now.getMonth() + 1;
    const year   = now.getFullYear();
    const lastM  = month === 1 ? 12 : month - 1;
    const lastY  = month === 1 ? year - 1 : year;

    const [summary, previous, topCategory] = await Promise.all([
      pool.query(
        `SELECT
          COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END),0) AS total_income,
          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS total_expenses,
          COALESCE(SUM(CASE WHEN type='income'  THEN amount
                            WHEN type='expense' THEN -amount END),0)        AS net_savings
         FROM transactions
         WHERE user_id=$1
           AND EXTRACT(MONTH FROM date)=$2
           AND EXTRACT(YEAR  FROM date)=$3`,
        [userId, month, year]
      ),
      pool.query(
        `SELECT
          COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END),0) AS income,
          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS expenses,
          COALESCE(SUM(CASE WHEN type='income'  THEN amount
                            WHEN type='expense' THEN -amount END),0)        AS savings
         FROM transactions
         WHERE user_id=$1
           AND EXTRACT(MONTH FROM date)=$2
           AND EXTRACT(YEAR  FROM date)=$3`,
        [userId, lastM, lastY]
      ),
      pool.query(
        `SELECT c.name, SUM(t.amount) AS total
         FROM transactions t
         JOIN categories c ON t.category_id=c.id
         WHERE t.user_id=$1 AND t.type='expense'
           AND EXTRACT(MONTH FROM t.date)=$2
           AND EXTRACT(YEAR  FROM t.date)=$3
         GROUP BY c.name ORDER BY total DESC LIMIT 1`,
        [userId, month, year]
      ),
    ]);

    const result = await aiService.getMonthlySummary({
      summary:         summary.rows[0],
      previousSummary: previous.rows[0],
      topCategory:     topCategory.rows[0],
    });

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET BUDGET ADVICE ────────────────────────────────────────────────────────
// GET /api/insights/budget-advice
const getBudgetAdvice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const month  = new Date().getMonth() + 1;
    const year   = new Date().getFullYear();

    const [incomeResult, expensesResult, goalsResult] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS income
         FROM transactions
         WHERE user_id=$1 AND type='income'
           AND EXTRACT(MONTH FROM date)=$2
           AND EXTRACT(YEAR  FROM date)=$3`,
        [userId, month, year]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS expenses
         FROM transactions
         WHERE user_id=$1 AND type='expense'
           AND EXTRACT(MONTH FROM date)=$2
           AND EXTRACT(YEAR  FROM date)=$3`,
        [userId, month, year]
      ),
      pool.query('SELECT title FROM goals WHERE user_id=$1', [userId]),
    ]);

    const result = await aiService.getBudgetAdvice({
      income:   incomeResult.rows[0].income,
      expenses: expensesResult.rows[0].expenses,
      goals:    goalsResult.rows,
    });

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getInsights, getMonthlySummary, getBudgetAdvice };