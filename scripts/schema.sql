-- Agent Intel: Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Agents table
CREATE TABLE agents (
  cea_number TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  agency TEXT,
  phone TEXT,
  email TEXT,
  registration_start DATE,
  registration_end DATE,
  total_transactions INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_agency ON agents(agency);
CREATE INDEX idx_agents_name_trgm ON agents USING gin(name gin_trgm_ops);

-- Transactions table
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  cea_number TEXT NOT NULL REFERENCES agents(cea_number) ON DELETE CASCADE,
  date TEXT NOT NULL,
  property_type TEXT,
  transaction_type TEXT,
  role TEXT,
  location TEXT,
  hash TEXT UNIQUE
);

CREATE INDEX idx_transactions_cea ON transactions(cea_number);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_property_type ON transactions(property_type);
CREATE INDEX idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_year_text ON transactions (
  (
    CASE
      WHEN date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(date, 4)
      WHEN date ~ '^[0-9]{4}-' THEN LEFT(date, 4)
      ELSE NULL
    END
  )
);

-- Movements table
CREATE TABLE movements (
  id BIGSERIAL PRIMARY KEY,
  cea_number TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  previous_agency TEXT,
  new_agency TEXT,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agency_change', 'new_registration', 'deregistration', 'reregistration')),
  UNIQUE (cea_number, date, type)
);

CREATE INDEX idx_movements_date ON movements(date DESC);
CREATE INDEX idx_movements_type ON movements(type);

-- Leaderboard materialized view
CREATE MATERIALIZED VIEW leaderboard_mv AS
SELECT
  a.cea_number,
  a.name,
  a.agency,
  a.total_transactions AS transactions,
  RANK() OVER (ORDER BY a.total_transactions DESC) AS rank
FROM agents a
WHERE a.total_transactions > 0
ORDER BY rank;

CREATE UNIQUE INDEX idx_leaderboard_mv_cea ON leaderboard_mv(cea_number);
CREATE INDEX idx_leaderboard_mv_rank ON leaderboard_mv(rank);

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_leaderboard_years()
RETURNS TABLE(year INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    CASE
      WHEN t.date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(t.date, 4)::INTEGER
      WHEN t.date ~ '^[0-9]{4}-' THEN LEFT(t.date, 4)::INTEGER
      ELSE NULL
    END AS year
  FROM transactions t
  WHERE CASE
      WHEN t.date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(t.date, 4)
      WHEN t.date ~ '^[0-9]{4}-' THEN LEFT(t.date, 4)
      ELSE NULL
    END IS NOT NULL
  ORDER BY year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_leaderboard_property_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(property_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.property_type
  FROM transactions t
  WHERE t.property_type IS NOT NULL
    AND t.property_type <> ''
    AND (
      year_filter IS NULL
      OR CASE
        WHEN t.date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(t.date, 4)
        WHEN t.date ~ '^[0-9]{4}-' THEN LEFT(t.date, 4)
        ELSE NULL
      END = year_filter
    )
  ORDER BY t.property_type ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_leaderboard_transaction_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(transaction_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.transaction_type
  FROM transactions t
  WHERE t.transaction_type IS NOT NULL
    AND t.transaction_type <> ''
    AND (
      year_filter IS NULL
      OR CASE
        WHEN t.date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(t.date, 4)
        WHEN t.date ~ '^[0-9]{4}-' THEN LEFT(t.date, 4)
        ELSE NULL
      END = year_filter
    )
  ORDER BY t.transaction_type ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Year-based leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard(
  year_filter TEXT DEFAULT NULL,
  agency_filter TEXT DEFAULT NULL,
  property_type_filter TEXT DEFAULT NULL,
  transaction_type_filter TEXT DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 25
)
RETURNS TABLE(cea_number TEXT, name TEXT, agency TEXT, transactions BIGINT, rank BIGINT, total_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      a.cea_number,
      a.name,
      a.agency,
      COUNT(t.id) AS transactions,
      RANK() OVER (ORDER BY COUNT(t.id) DESC) AS rank
    FROM agents a
    JOIN transactions t ON t.cea_number = a.cea_number
    WHERE (
      year_filter IS NULL
      OR CASE
        WHEN t.date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(t.date, 4)
        WHEN t.date ~ '^[0-9]{4}-' THEN LEFT(t.date, 4)
        ELSE NULL
      END = year_filter
    )
      AND (agency_filter IS NULL OR a.agency = agency_filter)
      AND (property_type_filter IS NULL OR t.property_type = property_type_filter)
      AND (transaction_type_filter IS NULL OR t.transaction_type = transaction_type_filter)
    GROUP BY a.cea_number, a.name, a.agency
    HAVING COUNT(t.id) > 0
  )
  SELECT r.cea_number, r.name, r.agency, r.transactions, r.rank,
    (SELECT COUNT(*) FROM ranked) AS total_count
  FROM ranked r
  ORDER BY r.rank ASC
  LIMIT page_size OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security: public read, no public write
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON agents FOR SELECT USING (true);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON transactions FOR SELECT USING (true);

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON movements FOR SELECT USING (true);
