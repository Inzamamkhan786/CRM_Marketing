const pool = require('../db/pool');
const { buildSegmentQuery } = require('../services/segment.service');

// POST /segments
const createSegment = async (req, res) => {
  try {
    const { name, rules } = req.body;
    if (!name || !rules) return res.status(400).json({ error: 'name and rules are required' });

    // Preview count before saving
    const { sql, params } = buildSegmentQuery(rules);
    const countResult = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS sub`, params);
    const audience_size = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `INSERT INTO segments (name, rules, audience_size) VALUES ($1, $2, $3) RETURNING *`,
      [name, JSON.stringify(rules), audience_size]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createSegment error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// GET /segments
const getSegments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM segments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('getSegments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /segments/:id/preview  — returns matching customers
const previewSegment = async (req, res) => {
  try {
    const { id } = req.params;
    const seg = await pool.query('SELECT * FROM segments WHERE id = $1', [id]);
    if (seg.rows.length === 0) return res.status(404).json({ error: 'Segment not found' });

    const rules = seg.rows[0].rules;
    const { sql, params } = buildSegmentQuery(rules);
    const customers = await pool.query(sql, params);

    res.json({
      segment: seg.rows[0],
      audience_size: customers.rows.length,
      customers: customers.rows,
    });
  } catch (err) {
    console.error('previewSegment error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// POST /segments/preview  — preview without saving
const previewRules = async (req, res) => {
  try {
    const { rules } = req.body;
    if (!rules) return res.status(400).json({ error: 'rules are required' });

    const { sql, params } = buildSegmentQuery(rules);
    const customers = await pool.query(sql, params);

    res.json({
      audience_size: customers.rows.length,
      customers: customers.rows.slice(0, 20), // return first 20 as preview
    });
  } catch (err) {
    console.error('previewRules error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// DELETE /segments/:id
const deleteSegment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM segments WHERE id=$1', [id]);
    res.json({ message: 'Segment deleted' });
  } catch (err) {
    console.error('deleteSegment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createSegment, getSegments, previewSegment, previewRules, deleteSegment };
