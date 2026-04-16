-- Manual performance indexes for PropNext Intel summary RPCs
-- Run these one at a time in the Supabase SQL Editor after the tracked migration
-- `20260416093000_summary_rpc_optimizations.sql` has been applied.
--
-- Use CONCURRENTLY so index creation does not take heavy locks on large tables.
-- These statements must NOT be wrapped in a transaction.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_cea
  ON transactions(cea_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_cea_year
  ON transactions(cea_number, year);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_cea_date
  ON transactions(cea_number, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_year_cea
  ON transactions(year, cea_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_property_type
  ON transactions(property_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_transaction_type
  ON transactions(transaction_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movements_cea_date
  ON movements(cea_number, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movements_type_date
  ON movements(type, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movements_previous_agency_date
  ON movements(previous_agency, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movements_new_agency_date
  ON movements(new_agency, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_agency
  ON agents(agency);
