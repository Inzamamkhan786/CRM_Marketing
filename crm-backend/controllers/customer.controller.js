const pool = require('../db/pool');

// POST /customers
const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, city)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, phone || null, city || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('addCustomer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /customers
const getCustomers = async (req, res) => {
  try {
    const { search, city } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (city) {
      params.push(city);
      query += ` AND city = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getCustomers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /customers/:id
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customer.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });

    const orders = await pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_date DESC',
      [id]
    );
    res.json({ ...customer.rows[0], orders: orders.rows });
  } catch (err) {
    console.error('getCustomerById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, city } = req.body;
    const result = await pool.query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, city=$4
       WHERE id=$5 RETURNING *`,
      [name, email, phone, city, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateCustomer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM customers WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('deleteCustomer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /customers/import  — CSV import (multipart)
const importCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const csvText = req.file.buffer.toString('utf8');
    const lines = csvText.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const nameIdx  = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const phoneIdx = headers.indexOf('phone');
    const cityIdx  = headers.indexOf('city');

    if (nameIdx === -1 || emailIdx === -1) {
      return res.status(400).json({ error: 'CSV must have at least name and email columns' });
    }

    let imported = 0;
    let skipped  = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const name  = cols[nameIdx];
      const email = cols[emailIdx];
      const phone = phoneIdx !== -1 ? cols[phoneIdx] : null;
      const city  = cityIdx  !== -1 ? cols[cityIdx]  : null;

      if (!name || !email) { skipped++; continue; }

      try {
        await pool.query(
          `INSERT INTO customers (name, email, phone, city)
           VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
          [name, email, phone, city]
        );
        imported++;
      } catch (_) {
        skipped++;
      }
    }

    res.json({ message: `Imported ${imported} customers, skipped ${skipped}` });
  } catch (err) {
    console.error('importCSV error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { addCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer, importCSV };
