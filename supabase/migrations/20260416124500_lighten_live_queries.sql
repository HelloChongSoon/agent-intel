-- Lighten remaining live query hotspots after the first summary RPC pass.
-- Focus:
-- 1. avoid exact counts on paginated movements history
-- 2. use a single RPC for agency movements
-- 3. use a single narrow RPC for search result summaries

CREATE OR REPLACE FUNCTION get_movements_page(
  type_filter TEXT DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 20
)
RETURNS TABLE(
  id BIGINT,
  cea_number TEXT,
  agent_name TEXT,
  previous_agency TEXT,
  new_agency TEXT,
  date TIMESTAMPTZ,
  type TEXT,
  has_more BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH filtered AS (
    SELECT
      m.id,
      m.cea_number,
      m.agent_name,
      m.previous_agency,
      m.new_agency,
      m.date,
      m.type
    FROM movements m
    WHERE (type_filter IS NULL OR m.type = type_filter)
      AND (
        search_query IS NULL
        OR search_query = ''
        OR m.agent_name ILIKE '%' || REPLACE(REPLACE(search_query, '%', ''), '_', '') || '%'
        OR m.cea_number ILIKE '%' || REPLACE(REPLACE(search_query, '%', ''), '_', '') || '%'
      )
  ),
  paged AS (
    SELECT *
    FROM filtered
    ORDER BY date DESC, id DESC
    LIMIT page_size + 1
    OFFSET GREATEST(page_num - 1, 0) * page_size
  ),
  meta AS (
    SELECT COUNT(*) > page_size AS has_more
    FROM paged
  )
  SELECT
    p.id,
    p.cea_number,
    p.agent_name,
    p.previous_agency,
    p.new_agency,
    p.date,
    p.type,
    meta.has_more
  FROM (
    SELECT *
    FROM paged
    ORDER BY date DESC, id DESC
    LIMIT page_size
  ) p
  CROSS JOIN meta;
$$;

CREATE OR REPLACE FUNCTION get_agency_movements(
  agency_filter TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE(
  id BIGINT,
  cea_number TEXT,
  agent_name TEXT,
  previous_agency TEXT,
  new_agency TEXT,
  date TIMESTAMPTZ,
  type TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    movement_rows.id,
    movement_rows.cea_number,
    movement_rows.agent_name,
    movement_rows.previous_agency,
    movement_rows.new_agency,
    movement_rows.date,
    movement_rows.type
  FROM (
    SELECT DISTINCT ON (m.id)
      m.id,
      m.cea_number,
      m.agent_name,
      m.previous_agency,
      m.new_agency,
      m.date,
      m.type
    FROM movements m
    WHERE m.previous_agency = agency_filter
       OR m.new_agency = agency_filter
    ORDER BY m.id, m.date DESC
  ) movement_rows
  ORDER BY movement_rows.date DESC, movement_rows.id DESC
  LIMIT result_limit;
$$;

CREATE OR REPLACE FUNCTION search_agents_with_summaries(
  query_text TEXT,
  result_limit INT DEFAULT 50
)
RETURNS TABLE(
  cea_number TEXT,
  name TEXT,
  agency TEXT,
  total_transactions BIGINT,
  latest_activity TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH cleaned AS (
    SELECT NULLIF(BTRIM(REPLACE(REPLACE(query_text, '%', ''), '_', '')), '') AS query_value
  ),
  matched_agents AS (
    SELECT
      a.cea_number,
      a.name,
      a.agency
    FROM agents a
    CROSS JOIN cleaned c
    WHERE c.query_value IS NOT NULL
      AND (
        a.cea_number ILIKE '%' || c.query_value || '%'
        OR a.name ILIKE '%' || c.query_value || '%'
      )
    ORDER BY
      CASE
        WHEN UPPER(a.cea_number) = UPPER(c.query_value) THEN 0
        WHEN UPPER(a.name) = UPPER(c.query_value) THEN 1
        WHEN a.cea_number ILIKE c.query_value || '%' THEN 2
        WHEN a.name ILIKE c.query_value || '%' THEN 3
        ELSE 4
      END,
      a.total_transactions DESC NULLS LAST,
      a.name ASC
    LIMIT result_limit
  ),
  counts AS (
    SELECT
      t.cea_number,
      COUNT(*)::BIGINT AS total_transactions
    FROM transactions t
    JOIN matched_agents ma ON ma.cea_number = t.cea_number
    GROUP BY t.cea_number
  ),
  latest AS (
    SELECT DISTINCT ON (t.cea_number)
      t.cea_number,
      t.date AS latest_activity
    FROM transactions t
    JOIN matched_agents ma ON ma.cea_number = t.cea_number
    ORDER BY t.cea_number, transaction_sort_key(t.date, t.year) DESC NULLS LAST, t.date DESC
  )
  SELECT
    ma.cea_number,
    ma.name,
    ma.agency,
    COALESCE(counts.total_transactions, 0)::BIGINT AS total_transactions,
    latest.latest_activity
  FROM matched_agents ma
  LEFT JOIN counts ON counts.cea_number = ma.cea_number
  LEFT JOIN latest ON latest.cea_number = ma.cea_number
  ORDER BY
    CASE
      WHEN UPPER(ma.cea_number) = UPPER((SELECT query_value FROM cleaned)) THEN 0
      WHEN UPPER(ma.name) = UPPER((SELECT query_value FROM cleaned)) THEN 1
      WHEN ma.cea_number ILIKE (SELECT query_value FROM cleaned) || '%' THEN 2
      WHEN ma.name ILIKE (SELECT query_value FROM cleaned) || '%' THEN 3
      ELSE 4
    END,
    total_transactions DESC,
    ma.name ASC;
$$;
