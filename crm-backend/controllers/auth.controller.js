const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'novacrm_super_secret_key_change_in_prod';
const JWT_EXPIRES = '7d';

// ── Register a new company ────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { company_name, email, password } = req.body;
  if (!company_name || !email || !password)
    return res.status(400).json({ error: 'company_name, email and password are required.' });

  try {
    // Check duplicate email
    const exists = await pool.query('SELECT id FROM companies WHERE email = $1', [email]);
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'A company with this email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO companies (company_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, company_name, email, created_at`,
      [company_name, email, hash]
    );
    const company = result.rows[0];
    const token = jwt.sign({ companyId: company.id, email: company.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ token, company });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required.' });

  try {
    const result = await pool.query('SELECT * FROM companies WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const company = result.rows[0];
    const valid = await bcrypt.compare(password, company.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ companyId: company.id, email: company.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({
      token,
      company: { id: company.id, company_name: company.company_name, email: company.email }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
};

// ── Get current company (me) ──────────────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, company_name, email, created_at FROM companies WHERE id = $1',
      [req.companyId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Company not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};
