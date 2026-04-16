#!/bin/bash
# Backfill area column in batches of 2000

SUPABASE_URL="${SUPABASE_URL:?Set SUPABASE_URL env var}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY env var}"
BATCH=2000
TOTAL=0

echo "Starting area backfill..."

while true; do
  RESULT=$(curl -s -w "\n%{http_code}" \
    "${SUPABASE_URL}/rest/v1/rpc/backfill_area_batch" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"batch_size\": ${BATCH}}")

  HTTP_CODE=$(echo "$RESULT" | tail -1)
  BODY=$(echo "$RESULT" | head -1)

  if [ "$HTTP_CODE" != "200" ]; then
    echo "Error (HTTP $HTTP_CODE): $BODY"
    exit 1
  fi

  ROWS=$(echo "$BODY" | tr -d '"')

  if [ "$ROWS" = "0" ] || [ -z "$ROWS" ]; then
    echo "Done! Total rows updated: $TOTAL"
    break
  fi

  TOTAL=$((TOTAL + ROWS))
  echo "Updated $ROWS rows (total: $TOTAL)"
done
