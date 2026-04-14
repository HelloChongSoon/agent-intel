-- Migration: Add year column to transactions for fast filtering
-- Run this in Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS year SMALLINT;

-- Step 2: Populate from existing date strings
UPDATE transactions SET year = CASE
  WHEN date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(date, 4)::SMALLINT
  WHEN date ~ '^[0-9]{4}-' THEN LEFT(date, 4)::SMALLINT
  ELSE NULL
END
WHERE year IS NULL;

-- Step 3: Index it
CREATE INDEX IF NOT EXISTS idx_transactions_year ON transactions(year);
CREATE INDEX IF NOT EXISTS idx_transactions_year_cea ON transactions(year, cea_number);

-- Step 4: Drop the old computed expression index (no longer needed)
DROP INDEX IF EXISTS idx_transactions_year_text;

-- Step 5: Rewrite get_available_leaderboard_years to use the column
CREATE OR REPLACE FUNCTION get_available_leaderboard_years()
RETURNS TABLE(year INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.year::INTEGER
  FROM transactions t
  WHERE t.year IS NOT NULL
  ORDER BY year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Rewrite get_leaderboard to use the column
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
    WHERE (year_filter IS NULL OR t.year = year_filter::SMALLINT)
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

-- Step 7: Rewrite property type filter to use year column
CREATE OR REPLACE FUNCTION get_available_leaderboard_property_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(property_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.property_type
  FROM transactions t
  WHERE t.property_type IS NOT NULL
    AND t.property_type <> ''
    AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
  ORDER BY t.property_type ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Rewrite transaction type filter to use year column
CREATE OR REPLACE FUNCTION get_available_leaderboard_transaction_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(transaction_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.transaction_type
  FROM transactions t
  WHERE t.transaction_type IS NOT NULL
    AND t.transaction_type <> ''
    AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
  ORDER BY t.transaction_type ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
