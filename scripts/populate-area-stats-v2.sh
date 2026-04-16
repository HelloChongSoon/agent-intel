#!/bin/bash
# Populate area_stats table one area at a time via supabase CLI

AREAS=(
  "Anson/ Tanjong Pagar"
  "Ardmore/ Bukit Timah/ Holland Road/ Tanglin"
  "Balestier/ Toa Payoh/ Serangoon"
  "Bedok/ Upper East Coast/ Eastwood/ Kew Drive"
  "Bishan/ Ang Mo Kio"
  "Geylang/ Eunos"
  "High Street/ Beach Road (part)"
  "Hillview/ Dairy Farm/ Bukit Panjang/ Choa Chu Kang"
  "Jurong"
  "Katong/ Joo Chiat/ Amber Road"
  "Kranji/ Woodgrove"
  "Lim Chu Kang/ Tengah"
  "Little India"
  "Loyang/ Changi"
  "Macpherson/ Braddell"
  "Middle Road/ Golden Mile"
  "Orchard/ Cairnhill/ River Valley"
  "Pasir Panjang/ Hong Leong Garden/ Clementi New Town"
  "Queenstown/ Tiong Bahru"
  "Raffles Place/ Cecil/ Marina/ People's Park"
  "Serangoon Garden/ Hougang/ Punggol"
  "Tampines/ Pasir Ris"
  "Telok Blangah/ Harbourfront"
  "Upper Bukit Timah/ Clementi Park/ Ulu Pandan"
  "Upper Thomson/ Springleaf"
  "Watten Estate/ Novena/ Thomson"
  "Yishun/ Sembawang"
  "Ardmore"
  "Hillview"
  "Katong"
  "Lim Chu Kang"
  "Loyang"
  "Seletar"
  "PASIR RIS"
)

TOTAL=0
FAILED=0

echo "Populating area_stats for ${#AREAS[@]} areas..."
echo ""

for AREA in "${AREAS[@]}"; do
  # Escape single quotes for SQL
  SQL_AREA=$(printf '%s' "$AREA" | sed "s/'/''/g")

  # Two-step: 1) insert with txn count, 2) update with agent count
  RESULT=$(supabase db query --linked --output json "
    INSERT INTO area_stats (area, agent_count, transaction_count)
    VALUES ('${SQL_AREA}', 0, 0)
    ON CONFLICT (area) DO NOTHING;

    UPDATE area_stats SET
      transaction_count = (SELECT COUNT(*) FROM transactions WHERE area = '${SQL_AREA}'),
      agent_count = (SELECT COUNT(*) FROM (SELECT DISTINCT cea_number FROM transactions WHERE area = '${SQL_AREA}') sub)
    WHERE area = '${SQL_AREA}'
    RETURNING area, agent_count, transaction_count;
  " 2>&1)

  if echo "$RESULT" | grep -q '"agent_count"'; then
    AGENTS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d['rows'][0]['agent_count'])" 2>/dev/null || echo "?")
    TXNS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d['rows'][0]['transaction_count'])" 2>/dev/null || echo "?")
    TOTAL=$((TOTAL + 1))
    echo "  ✓ $AREA → $AGENTS agents, $TXNS txns"
  else
    FAILED=$((FAILED + 1))
    ERROR=$(echo "$RESULT" | head -c 200)
    echo "  ✗ $AREA → $ERROR"
  fi

  sleep 3
done

echo ""
echo "Done! Populated: $TOTAL, Failed: $FAILED"
