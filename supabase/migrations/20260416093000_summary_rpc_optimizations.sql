-- Summary RPC optimizations for PropNext Intel
-- Focus: reduce request-time scans in agent, agency, leaderboard, search, and movements pages.
-- Heavy index creation is intentionally kept out of this tracked migration so `supabase db push`
-- can apply the RPCs without timing out. Run the companion manual SQL file after this lands.

CREATE OR REPLACE FUNCTION transaction_year_from_text(raw_date TEXT)
RETURNS SMALLINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN raw_date ~ '^[A-Z]{3}-[0-9]{4}$' THEN RIGHT(raw_date, 4)::SMALLINT
    WHEN raw_date ~ '^[0-9]{4}-' THEN LEFT(raw_date, 4)::SMALLINT
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION transaction_month_index(raw_date TEXT)
RETURNS SMALLINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN raw_date ~ '^[A-Z]{3}-[0-9]{4}$' THEN
      CASE UPPER(LEFT(raw_date, 3))
        WHEN 'JAN' THEN 0
        WHEN 'FEB' THEN 1
        WHEN 'MAR' THEN 2
        WHEN 'APR' THEN 3
        WHEN 'MAY' THEN 4
        WHEN 'JUN' THEN 5
        WHEN 'JUL' THEN 6
        WHEN 'AUG' THEN 7
        WHEN 'SEP' THEN 8
        WHEN 'OCT' THEN 9
        WHEN 'NOV' THEN 10
        WHEN 'DEC' THEN 11
        ELSE NULL
      END
    WHEN raw_date ~ '^[0-9]{4}-[0-9]{2}' THEN SUBSTRING(raw_date FROM 6 FOR 2)::SMALLINT - 1
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION transaction_sort_key(raw_date TEXT, raw_year SMALLINT DEFAULT NULL)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(raw_year, transaction_year_from_text(raw_date)) IS NULL THEN NULL
    ELSE (
      COALESCE(raw_year, transaction_year_from_text(raw_date))::BIGINT * 100
      + COALESCE(transaction_month_index(raw_date), 0)::BIGINT
    )
  END;
$$;

CREATE OR REPLACE FUNCTION get_leaderboard(
  year_filter TEXT DEFAULT NULL,
  agency_filter TEXT DEFAULT NULL,
  property_type_filter TEXT DEFAULT NULL,
  transaction_type_filter TEXT DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 25
)
RETURNS TABLE(cea_number TEXT, name TEXT, agency TEXT, transactions BIGINT, rank BIGINT, total_count BIGINT)
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
      RANK() OVER (ORDER BY tx.transactions DESC) AS rank
    FROM tx_ranked tx
    JOIN agents a ON a.cea_number = tx.cea_number
    WHERE (agency_filter IS NULL OR a.agency = agency_filter)
  ),
  total AS (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM ranked
  )
  SELECT
    r.cea_number,
    r.name,
    r.agency,
    r.transactions,
    r.rank,
    total.cnt AS total_count
  FROM ranked r
  CROSS JOIN total
  ORDER BY r.rank ASC, r.cea_number ASC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
$$;

CREATE OR REPLACE FUNCTION get_agent_summary(target_cea TEXT)
RETURNS TABLE(
  cea_number TEXT,
  total_transactions BIGINT,
  latest_activity TEXT,
  top_property_types JSONB,
  top_transaction_types JSONB,
  top_roles JSONB,
  unique_area_count BIGINT,
  monthly_activity JSONB,
  top_recent_areas JSONB,
  filter_property_types TEXT[],
  filter_transaction_types TEXT[],
  filter_roles TEXT[],
  filter_years INTEGER[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH tx AS (
    SELECT
      t.date,
      t.property_type,
      t.transaction_type,
      t.role,
      COALESCE(NULLIF(t.area, ''), NULLIF(BTRIM(SPLIT_PART(t.location, ',', 2)), '')) AS area,
      COALESCE(t.year, transaction_year_from_text(t.date))::INTEGER AS tx_year,
      transaction_month_index(t.date)::INTEGER AS month_index,
      transaction_sort_key(t.date, t.year) AS sort_key
    FROM transactions t
    WHERE t.cea_number = target_cea
  ),
  recent_tx AS (
    SELECT *
    FROM tx
    ORDER BY sort_key DESC NULLS LAST, date DESC
    LIMIT 60
  )
  SELECT
    target_cea AS cea_number,
    COALESCE((SELECT COUNT(*) FROM tx), 0)::BIGINT AS total_transactions,
    (
      SELECT tx.date
      FROM tx
      ORDER BY tx.sort_key DESC NULLS LAST, tx.date DESC
      LIMIT 1
    ) AS latest_activity,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('property_type', property_type, 'count', cnt)
        ORDER BY cnt DESC, property_type ASC
      )
      FROM (
        SELECT tx.property_type, COUNT(*)::BIGINT AS cnt
        FROM tx
        WHERE tx.property_type IS NOT NULL AND tx.property_type <> ''
        GROUP BY tx.property_type
        ORDER BY cnt DESC, tx.property_type ASC
        LIMIT 4
      ) grouped
    ), '[]'::JSONB) AS top_property_types,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('transaction_type', transaction_type, 'count', cnt)
        ORDER BY cnt DESC, transaction_type ASC
      )
      FROM (
        SELECT tx.transaction_type, COUNT(*)::BIGINT AS cnt
        FROM tx
        WHERE tx.transaction_type IS NOT NULL AND tx.transaction_type <> ''
        GROUP BY tx.transaction_type
        ORDER BY cnt DESC, tx.transaction_type ASC
        LIMIT 4
      ) grouped
    ), '[]'::JSONB) AS top_transaction_types,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('role', role, 'count', cnt)
        ORDER BY cnt DESC, role ASC
      )
      FROM (
        SELECT tx.role, COUNT(*)::BIGINT AS cnt
        FROM tx
        WHERE tx.role IS NOT NULL AND tx.role <> ''
        GROUP BY tx.role
        ORDER BY cnt DESC, tx.role ASC
        LIMIT 3
      ) grouped
    ), '[]'::JSONB) AS top_roles,
    COALESCE((
      SELECT COUNT(DISTINCT tx.area)
      FROM tx
      WHERE tx.area IS NOT NULL AND tx.area <> ''
    ), 0)::BIGINT AS unique_area_count,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('bucket', bucket, 'count', cnt)
        ORDER BY sort_key ASC
      )
      FROM (
        SELECT
          TO_CHAR(MAKE_DATE(tx.tx_year, tx.month_index + 1, 1), 'MON-YYYY') AS bucket,
          COUNT(*)::BIGINT AS cnt,
          MAX(tx.sort_key) AS sort_key
        FROM tx
        WHERE tx.tx_year IS NOT NULL
          AND tx.month_index IS NOT NULL
        GROUP BY tx.tx_year, tx.month_index
        ORDER BY sort_key DESC
        LIMIT 12
      ) monthly
    ), '[]'::JSONB) AS monthly_activity,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('area', area, 'count', cnt)
        ORDER BY cnt DESC, area ASC
      )
      FROM (
        SELECT recent_tx.area, COUNT(*)::BIGINT AS cnt
        FROM recent_tx
        WHERE recent_tx.area IS NOT NULL AND recent_tx.area <> ''
        GROUP BY recent_tx.area
        ORDER BY cnt DESC, recent_tx.area ASC
        LIMIT 8
      ) recent_areas
    ), '[]'::JSONB) AS top_recent_areas,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.property_type
        FROM tx
        WHERE tx.property_type IS NOT NULL AND tx.property_type <> ''
        ORDER BY tx.property_type ASC
      )
    ), ARRAY[]::TEXT[]) AS filter_property_types,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.transaction_type
        FROM tx
        WHERE tx.transaction_type IS NOT NULL AND tx.transaction_type <> ''
        ORDER BY tx.transaction_type ASC
      )
    ), ARRAY[]::TEXT[]) AS filter_transaction_types,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.role
        FROM tx
        WHERE tx.role IS NOT NULL AND tx.role <> ''
        ORDER BY tx.role ASC
      )
    ), ARRAY[]::TEXT[]) AS filter_roles,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.tx_year
        FROM tx
        WHERE tx.tx_year IS NOT NULL
        ORDER BY tx.tx_year DESC
      )
    ), ARRAY[]::INTEGER[]) AS filter_years;
$$;

CREATE OR REPLACE FUNCTION get_agent_transaction_filters(
  target_cea TEXT,
  year_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  property_types TEXT[],
  transaction_types TEXT[],
  roles TEXT[],
  years INTEGER[],
  month_indexes INTEGER[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH tx AS (
    SELECT
      t.property_type,
      t.transaction_type,
      t.role,
      COALESCE(t.year, transaction_year_from_text(t.date))::INTEGER AS tx_year,
      transaction_month_index(t.date)::INTEGER AS month_index
    FROM transactions t
    WHERE t.cea_number = target_cea
  )
  SELECT
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.property_type
        FROM tx
        WHERE tx.property_type IS NOT NULL AND tx.property_type <> ''
        ORDER BY tx.property_type ASC
      )
    ), ARRAY[]::TEXT[]) AS property_types,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.transaction_type
        FROM tx
        WHERE tx.transaction_type IS NOT NULL AND tx.transaction_type <> ''
        ORDER BY tx.transaction_type ASC
      )
    ), ARRAY[]::TEXT[]) AS transaction_types,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.role
        FROM tx
        WHERE tx.role IS NOT NULL AND tx.role <> ''
        ORDER BY tx.role ASC
      )
    ), ARRAY[]::TEXT[]) AS roles,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.tx_year
        FROM tx
        WHERE tx.tx_year IS NOT NULL
        ORDER BY tx.tx_year DESC
      )
    ), ARRAY[]::INTEGER[]) AS years,
    COALESCE((
      SELECT ARRAY(
        SELECT DISTINCT tx.month_index
        FROM tx
        WHERE tx.month_index IS NOT NULL
          AND (year_filter IS NULL OR tx.tx_year = year_filter::INTEGER)
        ORDER BY tx.month_index ASC
      )
    ), ARRAY[]::INTEGER[]) AS month_indexes;
$$;

CREATE OR REPLACE FUNCTION get_agent_transactions_page(
  target_cea TEXT,
  property_type_filter TEXT DEFAULT NULL,
  transaction_type_filter TEXT DEFAULT NULL,
  role_filter TEXT DEFAULT NULL,
  year_filter TEXT DEFAULT NULL,
  month_filter INTEGER DEFAULT NULL,
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 25
)
RETURNS TABLE(
  date TEXT,
  property_type TEXT,
  transaction_type TEXT,
  role TEXT,
  location TEXT,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH filtered AS (
    SELECT
      t.date,
      t.property_type,
      t.transaction_type,
      t.role,
      t.location,
      transaction_sort_key(t.date, t.year) AS sort_key
    FROM transactions t
    WHERE t.cea_number = target_cea
      AND (property_type_filter IS NULL OR t.property_type = property_type_filter)
      AND (transaction_type_filter IS NULL OR t.transaction_type = transaction_type_filter)
      AND (role_filter IS NULL OR t.role = role_filter)
      AND (year_filter IS NULL OR t.year = year_filter::SMALLINT)
      AND (month_filter IS NULL OR transaction_month_index(t.date) = month_filter)
  ),
  total AS (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM filtered
  )
  SELECT
    f.date,
    f.property_type,
    f.transaction_type,
    f.role,
    f.location,
    total.cnt AS total_count
  FROM filtered f
  CROSS JOIN total
  ORDER BY f.sort_key DESC NULLS LAST, f.date DESC, f.property_type ASC, f.transaction_type ASC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
$$;

CREATE OR REPLACE FUNCTION get_agent_search_summaries(cea_numbers TEXT[])
RETURNS TABLE(
  cea_number TEXT,
  total_transactions BIGINT,
  latest_activity TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH counts AS (
    SELECT
      t.cea_number,
      COUNT(*)::BIGINT AS total_transactions
    FROM transactions t
    WHERE t.cea_number = ANY(cea_numbers)
    GROUP BY t.cea_number
  ),
  latest AS (
    SELECT DISTINCT ON (t.cea_number)
      t.cea_number,
      t.date AS latest_activity
    FROM transactions t
    WHERE t.cea_number = ANY(cea_numbers)
    ORDER BY t.cea_number, transaction_sort_key(t.date, t.year) DESC NULLS LAST, t.date DESC
  )
  SELECT
    counts.cea_number,
    counts.total_transactions,
    latest.latest_activity
  FROM counts
  LEFT JOIN latest ON latest.cea_number = counts.cea_number;
$$;

CREATE OR REPLACE FUNCTION get_movement_insights(weeks INT DEFAULT 10)
RETURNS TABLE(
  total_movements BIGINT,
  counts_by_type JSONB,
  weekly_breakdown JSONB,
  top_agency_net_change JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH base AS (
    SELECT
      m.type,
      m.previous_agency,
      m.new_agency,
      DATE_TRUNC('week', m.date AT TIME ZONE 'UTC')::DATE AS week_start
    FROM movements m
  ),
  weekly AS (
    SELECT
      weekly_raw.week_start,
      jsonb_object_agg(weekly_raw.type, weekly_raw.cnt) AS counts,
      SUM(weekly_raw.cnt)::BIGINT AS total
    FROM (
      SELECT
        base.week_start,
        base.type,
        COUNT(*)::BIGINT AS cnt
      FROM base
      GROUP BY base.week_start, base.type
    ) weekly_raw
    GROUP BY weekly_raw.week_start
    ORDER BY weekly_raw.week_start DESC
    LIMIT GREATEST(weeks, 1)
  ),
  agency_net AS (
    SELECT
      net.agency,
      SUM(net.gained)::BIGINT AS gained,
      SUM(net.lost)::BIGINT AS lost,
      SUM(net.gained - net.lost)::BIGINT AS net
    FROM (
      SELECT m.new_agency AS agency, COUNT(*)::BIGINT AS gained, 0::BIGINT AS lost
      FROM movements m
      WHERE m.new_agency IS NOT NULL
      GROUP BY m.new_agency
      UNION ALL
      SELECT m.previous_agency AS agency, 0::BIGINT AS gained, COUNT(*)::BIGINT AS lost
      FROM movements m
      WHERE m.previous_agency IS NOT NULL
      GROUP BY m.previous_agency
    ) net
    WHERE net.agency IS NOT NULL
    GROUP BY net.agency
    ORDER BY ABS(SUM(net.gained - net.lost)) DESC, SUM(net.gained) DESC, net.agency ASC
    LIMIT 8
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM movements) AS total_movements,
    COALESCE((
      SELECT jsonb_object_agg(type_counts.type, type_counts.cnt)
      FROM (
        SELECT m.type, COUNT(*)::BIGINT AS cnt
        FROM movements m
        GROUP BY m.type
      ) type_counts
    ), '{}'::JSONB) AS counts_by_type,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'week_start', weekly.week_start::TEXT,
          'counts', weekly.counts,
          'total', weekly.total
        )
        ORDER BY weekly.week_start ASC
      )
      FROM weekly
    ), '[]'::JSONB) AS weekly_breakdown,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'agency', agency_net.agency,
          'gained', agency_net.gained,
          'lost', agency_net.lost,
          'net', agency_net.net
        )
        ORDER BY ABS(agency_net.net) DESC, agency_net.gained DESC, agency_net.agency ASC
      )
      FROM agency_net
    ), '[]'::JSONB) AS top_agency_net_change;
$$;

CREATE OR REPLACE FUNCTION get_agency_property_mix(agency_filter TEXT)
RETURNS TABLE(
  property_type TEXT,
  transaction_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH agency_agents AS (
    SELECT a.cea_number
    FROM agents a
    WHERE a.agency = agency_filter
  )
  SELECT
    t.property_type,
    COUNT(*)::BIGINT AS transaction_count
  FROM transactions t
  JOIN agency_agents a ON a.cea_number = t.cea_number
  WHERE t.property_type IS NOT NULL
    AND t.property_type <> ''
  GROUP BY t.property_type
  ORDER BY transaction_count DESC, t.property_type ASC;
$$;
