require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Required for Supabase transaction pooler (pgbouncer) on port 6543
  // pgbouncer does not support prepared statements
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

module.exports = pool;

