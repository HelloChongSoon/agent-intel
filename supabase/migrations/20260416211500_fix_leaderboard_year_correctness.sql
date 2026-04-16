-- Fix leaderboard correctness for year-filtered views.
-- 1. remove the old overloaded get_leaderboard variant that causes RPC ambiguity
-- 2. add a lighter page-based leaderboard RPC so the app no longer falls back
--    to lifetime agent totals when the exact-count RPC times out

DROP FUNCTION IF EXISTS public.get_leaderboard(text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_leaderboard_page(
  year_filter TEXT DEFAULT NULL,
  agency_filter TEXT DEFAULT NULL,
  property_type_filter TEXT DEFAULT NULL,
  transaction_type_filter TEXT DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 25
)
RETURNS TABLE(
  cea_number TEXT,
  name TEXT,
  agency TEXT,
  transactions BIGINT,
  rank BIGINT,
  has_more BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH tx_ranked AS (
    SELECT
      t.cea_number,
      COUNT(t.id)::BIGINT AS transactions
    FROM transactions t
    WHERE (year_filter IS NULL OR t.year = year_filter::SMALLINT)
      AND (property_type_filter IS NULL OR t.property_type = property_type_filter)
      AND (transaction_type_filter IS NULL OR t.transaction_type = transaction_type_filter)
    GROUP BY t.cea_number
    HAVING COUNT(t.id) > 0
  ),
  ranked AS (
    SELECT
      a.cea_number,
      a.name,
      a.agency,
      tx.transactions,
      RANK() OVER (ORDER BY tx.transactions DESC, a.cea_number ASC) AS rank
    FROM tx_ranked tx
    JOIN agents a ON a.cea_number = tx.cea_number
    WHERE (agency_filter IS NULL OR a.agency = agency_filter)
  ),
  paged AS (
    SELECT *
    FROM ranked
    ORDER BY rank ASC, cea_number ASC
    LIMIT page_size + 1
    OFFSET GREATEST(page_num - 1, 0) * page_size
  ),
  meta AS (
    SELECT COUNT(*) > page_size AS has_more
    FROM paged
  )
  SELECT
    p.cea_number,
    p.name,
    p.agency,
    p.transactions,
    p.rank,
    meta.has_more
  FROM (
    SELECT *
    FROM paged
    ORDER BY rank ASC, cea_number ASC
    LIMIT page_size
  ) p
  CROSS JOIN meta;
$$;
