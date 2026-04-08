-- Fix leaderboard year handling:
-- 1. Remove the hardcoded default year.
-- 2. Extract years safely from mixed text date formats.
-- 3. Expose only years that actually have data.
-- 4. Add an expression index so year-filtered leaderboard queries avoid timing out.

CREATE INDEX IF NOT EXISTS idx_transactions_year_text ON transactions (
  (
    CASE
      WHEN date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(date, 4)
      WHEN date ~ '^[0-9]{4}-' THEN LEFT(date, 4)
      ELSE NULL
    END
  )
);

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

CREATE OR REPLACE FUNCTION get_leaderboard(
  year_filter TEXT DEFAULT NULL,
  agency_filter TEXT DEFAULT NULL,
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
