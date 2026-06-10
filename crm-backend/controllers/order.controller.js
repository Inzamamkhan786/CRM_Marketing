const pool = require('../db/pool');

// POST /orders
const addOrder = async (req, res) => {
  try {
    const { customer_id, amount, order_date } = req.body;
    if (!customer_id || !amount) {
      return res.status(400).json({ error: 'customer_id and amount are required' });
    }
    const result = await pool.query(
      `INSERT INTO orders (customer_id, amount, order_date)
       VALUES ($1, $2, $3) RETURNING *`,
      [customer_id, amount, order_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('addOrder error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /orders  (optionally filter by customer_id)
const getOrders = async (req, res) => {
  try {
    const { customer_id } = req.query;
    let query = `
      SELECT o.*, c.name AS customer_name, c.email AS customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (customer_id) {
      params.push(customer_id);
      query += ` AND o.customer_id = $${params.length}`;
    }
    query += ' ORDER BY o.order_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { addOrder, getOrders };
