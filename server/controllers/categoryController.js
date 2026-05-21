const { pool } = require('../config/db');

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;

    let query = `
      SELECT * FROM categories
      WHERE user_id = $1
    `;
    const params = [req.user.id];

    if (type) {
      query += ` AND type = $2`;
      params.push(type);
    }

    query += ` ORDER BY name ASC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: { categories: result.rows },
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, color, icon, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and type',
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be income or expense',
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, color, icon, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, name, color || '#378ADD', icon || 'wallet', type]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;

    const result = await pool.query(
      `UPDATE categories
       SET name = $1, color = $2, icon = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, color, icon, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category: result.rows[0] },
    });

  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };