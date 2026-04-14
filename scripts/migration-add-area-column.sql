-- Migration: Add area column to transactions for programmatic SEO pages
-- Run this in Supabase SQL Editor (in batches if needed)

-- Step 1: Add the column
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS area TEXT;

-- Step 2: Populate from location (extract text after district code)
-- Run this in batches if it times out:
--   WHERE area IS NULL AND location IS NOT NULL AND location LIKE '%,%' AND year = 2026
--   (repeat for each year)
UPDATE transactions
SET area = TRIM(BOTH FROM SPLIT_PART(location, ',', 2))
WHERE area IS NULL AND location IS NOT NULL AND location LIKE '%,%';

-- Step 3: Index it
CREATE INDEX IF NOT EXISTS idx_transactions_area ON transactions(area);
CREATE INDEX IF NOT EXISTS idx_transactions_area_cea ON transactions(area, cea_number);
CREATE INDEX IF NOT EXISTS idx_transactions_area_property ON transactions(area, property_type);

-- Step 4: RPC — Get agents active in an area
CREATE OR REPLACE FUNCTION get_agents_by_area(
  area_filter TEXT,
  exclude_cea TEXT DEFAULT NULL,
  result_limit INT DEFAULT 4
)
RETURNS TABLE(cea_number TEXT, name TEXT, agency TEXT, total_transactions INT, area_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    a.cea_number,
    a.name,
    a.agency,
    a.total_transactions,
    COUNT(*) AS area_count
  FROM transactions t
  JOIN agents a ON a.cea_number = t.cea_number
  WHERE t.area = area_filter
    AND (exclude_cea IS NULL OR t.cea_number != exclude_cea)
  GROUP BY a.cea_number, a.name, a.agency, a.total_transactions
  ORDER BY area_count DESC
  LIMIT result_limit;
$$;

-- Step 5: RPC — Get agents by property type
CREATE OR REPLACE FUNCTION get_agents_by_property_type(
  property_type_filter TEXT,
  exclude_cea TEXT DEFAULT NULL,
  result_limit INT DEFAULT 4
)
RETURNS TABLE(cea_number TEXT, name TEXT, agency TEXT, total_transactions INT, type_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    a.cea_number,
    a.name,
    a.agency,
    a.total_transactions,
    COUNT(*) AS type_count
  FROM transactions t
  JOIN agents a ON a.cea_number = t.cea_number
  WHERE t.property_type = property_type_filter
    AND (exclude_cea IS NULL OR t.cea_number != exclude_cea)
  GROUP BY a.cea_number, a.name, a.agency, a.total_transactions
  ORDER BY type_count DESC
  LIMIT result_limit;
$$;

-- Step 6: RPC — Get area leaderboard (agents ranked by transactions in area)
CREATE OR REPLACE FUNCTION get_area_leaderboard(
  area_filter TEXT,
  year_filter TEXT DEFAULT NULL,
  agency_filter TEXT DEFAULT NULL,
  property_type_filter TEXT DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 25
)
RETURNS TABLE(cea_number TEXT, name TEXT, agency TEXT, transactions BIGINT, rank BIGINT, total_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
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
    WHERE t.area = area_filter
      AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
      AND (agency_filter IS NULL OR a.agency = agency_filter)
      AND (property_type_filter IS NULL OR t.property_type = property_type_filter)
    GROUP BY a.cea_number, a.name, a.agency
    HAVING COUNT(t.id) > 0
  )
  SELECT r.cea_number, r.name, r.agency, r.transactions, r.rank,
    (SELECT COUNT(*) FROM ranked) AS total_count
  FROM ranked r
  ORDER BY r.rank ASC
  LIMIT page_size OFFSET (page_num - 1) * page_size;
END;
$$;

-- Step 7: RPC — Get distinct areas with agent counts (for sitemaps and validation)
CREATE OR REPLACE FUNCTION get_areas(min_agents INT DEFAULT 3)
RETURNS TABLE(area TEXT, agent_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    t.area,
    COUNT(DISTINCT t.cea_number) AS agent_count
  FROM transactions t
  WHERE t.area IS NOT NULL AND t.area != ''
  GROUP BY t.area
  HAVING COUNT(DISTINCT t.cea_number) >= min_agents
  ORDER BY agent_count DESC;
$$;

-- Step 8: RPC — Get area + property type combos (for cross-dimensional sitemaps)
CREATE OR REPLACE FUNCTION get_area_property_type_combos(min_agents INT DEFAULT 5)
RETURNS TABLE(area TEXT, property_type TEXT, agent_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    t.area,
    t.property_type,
    COUNT(DISTINCT t.cea_number) AS agent_count
  FROM transactions t
  WHERE t.area IS NOT NULL AND t.area != ''
    AND t.property_type IS NOT NULL AND t.property_type != ''
  GROUP BY t.area, t.property_type
  HAVING COUNT(DISTINCT t.cea_number) >= min_agents
  ORDER BY agent_count DESC;
$$;
