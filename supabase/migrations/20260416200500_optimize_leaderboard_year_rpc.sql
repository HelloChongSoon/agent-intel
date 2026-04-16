-- Replace the DISTINCT year scan with indexed year existence probes.
-- This avoids timing out on large transaction tables when building the year dropdown.

CREATE OR REPLACE FUNCTION get_available_leaderboard_years()
RETURNS TABLE(year INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(MAX(t.year), EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT) AS max_year,
      COALESCE(MIN(t.year), EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT) AS min_year
    FROM transactions t
    WHERE t.year IS NOT NULL
  )
  SELECT candidate.year::INTEGER AS year
  FROM bounds
  CROSS JOIN LATERAL generate_series(bounds.max_year, bounds.min_year, -1) AS candidate(year)
  WHERE EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.year = candidate.year
    LIMIT 1
  )
  ORDER BY candidate.year DESC;
$$;
