-- NovaCRM: Companies table for multi-company JWT auth
-- Run this in your Supabase SQL editor (or any PostgreSQL instance)

CREATE TABLE IF NOT EXISTS companies (
  id            SERIAL PRIMARY KEY,
  company_name  VARCHAR(200)  NOT NULL,
  email         VARCHAR(200)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Optional: index on email for fast login lookups
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
