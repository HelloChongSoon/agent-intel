-- Fix slow leaderboard filter RPCs by using the indexed `transactions.year` column
-- instead of reparsing the raw `date` text on every request.

CREATE OR REPLACE FUNCTION get_available_leaderboard_years()
RETURNS TABLE(year INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT t.year::INTEGER AS year
  FROM transactions t
  WHERE t.year IS NOT NULL
  ORDER BY year DESC;
$$;

CREATE OR REPLACE FUNCTION get_available_leaderboard_property_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(property_type TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT t.property_type
  FROM transactions t
  WHERE t.property_type IS NOT NULL
    AND t.property_type <> ''
    AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
  ORDER BY t.property_type ASC;
$$;

CREATE OR REPLACE FUNCTION get_available_leaderboard_transaction_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(transaction_type TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT t.transaction_type
  FROM transactions t
  WHERE t.transaction_type IS NOT NULL
    AND t.transaction_type <> ''
    AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
  ORDER BY t.transaction_type ASC;
$$;
