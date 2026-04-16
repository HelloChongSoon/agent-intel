-- Migration: Optimize RPC functions for performance on 1.3M+ rows
-- Run each function separately in Supabase SQL Editor

-- ============================================================
-- 0. Composite index for property_type queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_property_type_cea
  ON transactions(property_type, cea_number);

-- ============================================================
-- 1. Optimized get_agents_by_area
--    Aggregate in subquery FIRST, then JOIN agents only for top N.
--    Uses COALESCE to avoid OR-based index kill.
-- ============================================================
CREATE OR REPLACE FUNCTION get_agents_by_area(
  area_filter TEXT,
  exclude_cea TEXT DEFAULT NULL,
  result_limit INT DEFAULT 4
)
RETURNS TABLE(cea_number TEXT, name TEXT, agency TEXT, total_transactions INT, area_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH top_agents AS (
    SELECT t.cea_number, COUNT(*) AS area_count
    FROM transactions t
    WHERE t.area = area_filter
      AND t.cea_number != COALESCE(exclude_cea, '')
    GROUP BY t.cea_number
    ORDER BY area_count DESC
    LIMIT result_limit
  )
  SELECT a.cea_number, a.name, a.agency, a.total_transactions, ta.area_count
  FROM top_agents ta
  JOIN agents a ON a.cea_number = ta.cea_number
  ORDER BY ta.area_count DESC;
$$;

-- ============================================================
-- 2. Optimized get_agents_by_property_type
--    Aggregate in subquery FIRST, then JOIN agents only for top N.
--    Uses COALESCE to avoid OR-based index kill.
-- ============================================================
CREATE OR REPLACE FUNCTION get_agents_by_property_type(
  property_type_filter TEXT,
  exclude_cea TEXT DEFAULT NULL,
  result_limit INT DEFAULT 4
)
RETURNS TABLE(cea_number TEXT, name TEXT, agency TEXT, total_transactions INT, type_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH top_agents AS (
    SELECT t.cea_number, COUNT(*) AS type_count
    FROM transactions t
    WHERE t.property_type = property_type_filter
      AND t.cea_number != COALESCE(exclude_cea, '')
    GROUP BY t.cea_number
    ORDER BY type_count DESC
    LIMIT result_limit
  )
  SELECT a.cea_number, a.name, a.agency, a.total_transactions, ta.type_count
  FROM top_agents ta
  JOIN agents a ON a.cea_number = ta.cea_number
  ORDER BY ta.type_count DESC;
$$;

-- ============================================================
-- 3. Optimized get_areas
--    Removed STABLE (incompatible with SET LOCAL).
--    SET LOCAL extends timeout for this heavy aggregation.
-- ============================================================
CREATE OR REPLACE FUNCTION get_areas(min_agents INT DEFAULT 3)
RETURNS TABLE(area TEXT, agent_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  SET LOCAL statement_timeout = '30s';
  RETURN QUERY
    SELECT t.area, COUNT(DISTINCT t.cea_number) AS agent_count
    FROM transactions t
    WHERE t.area IS NOT NULL AND t.area != ''
    GROUP BY t.area
    HAVING COUNT(DISTINCT t.cea_number) >= min_agents
    ORDER BY agent_count DESC;
END;
$$;

-- ============================================================
-- 4. Optimized get_area_property_type_combos
--    Removed STABLE (incompatible with SET LOCAL).
-- ============================================================
CREATE OR REPLACE FUNCTION get_area_property_type_combos(min_agents INT DEFAULT 5)
RETURNS TABLE(area TEXT, property_type TEXT, agent_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  SET LOCAL statement_timeout = '30s';
  RETURN QUERY
    SELECT t.area, t.property_type, COUNT(DISTINCT t.cea_number) AS agent_count
    FROM transactions t
    WHERE t.area IS NOT NULL AND t.area != ''
      AND t.property_type IS NOT NULL AND t.property_type != ''
    GROUP BY t.area, t.property_type
    HAVING COUNT(DISTINCT t.cea_number) >= min_agents
    ORDER BY agent_count DESC;
END;
$$;

-- ============================================================
-- 5. Optimized get_area_leaderboard
--    Aggregate in subquery first, set longer timeout.
-- ============================================================
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
  SET LOCAL statement_timeout = '30s';
  RETURN QUERY
  WITH ranked AS (
    SELECT
      t.cea_number,
      COUNT(t.id) AS transactions,
      RANK() OVER (ORDER BY COUNT(t.id) DESC) AS rank
    FROM transactions t
    WHERE t.area = area_filter
      AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
      AND (property_type_filter IS NULL OR t.property_type = property_type_filter)
    GROUP BY t.cea_number
    HAVING COUNT(t.id) > 0
  ),
  filtered AS (
    SELECT r.cea_number, r.transactions, r.rank
    FROM ranked r
    JOIN agents a ON a.cea_number = r.cea_number
    WHERE (agency_filter IS NULL OR a.agency = agency_filter)
  ),
  total AS (
    SELECT COUNT(*) AS cnt FROM filtered
  )
  SELECT f.cea_number, a.name, a.agency, f.transactions, f.rank, t.cnt AS total_count
  FROM filtered f
  JOIN agents a ON a.cea_number = f.cea_number
  CROSS JOIN total t
  ORDER BY f.rank ASC
  LIMIT page_size OFFSET (page_num - 1) * page_size;
END;
$$;
