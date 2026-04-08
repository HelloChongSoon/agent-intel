-- Fix leaderboard RPC default behavior so the frontend can choose the latest
-- available year instead of inheriting a hardcoded database default.

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
    WHERE (year_filter IS NULL OR t.date LIKE '%' || year_filter)
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
