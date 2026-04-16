-- Replace DISTINCT scans for leaderboard property and transaction filters
-- with small fixed-domain existence probes. This keeps the dropdowns responsive
-- even when the underlying transactions table is large.

CREATE OR REPLACE FUNCTION get_available_leaderboard_property_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(property_type TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH candidates(property_type) AS (
    VALUES
      ('CONDOMINIUM_APARTMENTS'::TEXT),
      ('EXECUTIVE_CONDOMINIUM'::TEXT),
      ('HDB'::TEXT),
      ('LANDED'::TEXT),
      ('STRATA_LANDED'::TEXT)
  )
  SELECT c.property_type
  FROM candidates c
  WHERE EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.property_type = c.property_type
      AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
    LIMIT 1
  )
  ORDER BY c.property_type ASC;
$$;

CREATE OR REPLACE FUNCTION get_available_leaderboard_transaction_types(year_filter TEXT DEFAULT NULL)
RETURNS TABLE(transaction_type TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH candidates(transaction_type) AS (
    VALUES
      ('NEW SALE'::TEXT),
      ('RESALE'::TEXT),
      ('ROOM RENTAL'::TEXT),
      ('SUB-SALE'::TEXT),
      ('WHOLE RENTAL'::TEXT)
  )
  SELECT c.transaction_type
  FROM candidates c
  WHERE EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.transaction_type = c.transaction_type
      AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
    LIMIT 1
  )
  ORDER BY c.transaction_type ASC;
$$;
