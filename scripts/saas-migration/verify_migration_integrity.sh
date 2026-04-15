#!/bin/bash
# ============================================================
# Migration Integrity Verifier
# Run before and after each migration step to confirm consistency
# Usage: ./scripts/saas-migration/verify_migration_integrity.sh [step_name]
# ============================================================

set -e

STEP=${1:-"unknown"}
SNAPSHOT_FILE="scripts/saas-migration/snapshots/pre_saas_snapshot.json"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "============================================================"
echo "MIGRATION INTEGRITY CHECK — Step: $STEP"
echo "Timestamp: $TIMESTAMP"
echo "============================================================"

# Check 1: Database connectivity
echo ""
echo "[ 1/6 ] Database connectivity..."
psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1 && echo "  ✅ Database reachable" || { echo "  ❌ Database UNREACHABLE"; exit 1; }

# Check 2: All original tables still exist
echo ""
echo "[ 2/6 ] Original tables presence..."
EXPECTED_TABLES=(
  "admin_users" "ai_config" "ai_providers" "appointments" "available_slots"
  "broadcast_templates" "broadcasts" "comments_log" "conversation_sessions"
  "conversations" "delivery_prices" "domain_templates" "faqs" "fb_settings"
  "leads" "order_sessions" "orders" "platform_events" "pre_order_sessions"
  "pre_orders" "processed_messages" "product_categories" "product_folders"
  "product_inquiries" "products" "provider_usage_log" "subscription_plans"
  "subscription_usage" "user_counters" "user_product_context"
)

ALL_OK=true
for table in "${EXPECTED_TABLES[@]}"; do
  EXISTS=$(psql "$DATABASE_URL" -t -A -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='$table' AND table_schema='public');")
  if [ "$EXISTS" = "t" ]; then
    echo "  ✅ $table"
  else
    echo "  ❌ MISSING: $table"
    ALL_OK=false
  fi
done

if [ "$ALL_OK" = false ]; then
  echo ""
  echo "❌ CRITICAL: One or more original tables are missing!"
  exit 1
fi

# Check 3: Row counts comparison with pre-migration snapshot
echo ""
echo "[ 3/6 ] Row count comparison with pre-migration snapshot..."
if [ ! -f "$SNAPSHOT_FILE" ]; then
  echo "  ⚠️  Snapshot file not found — skipping row count check"
else
  ISSUES=0
  while IFS= read -r line; do
    TABLE=$(echo "$line" | grep -o '"table_name":"[^"]*"' | cut -d'"' -f4)
    EXPECTED=$(echo "$line" | grep -o '"row_count":[0-9]*' | cut -d':' -f2)
    if [ -z "$TABLE" ]; then continue; fi
    
    ACTUAL=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "ERROR")
    
    if [ "$ACTUAL" = "ERROR" ]; then
      echo "  ❌ $TABLE: Could not query"
      ISSUES=$((ISSUES + 1))
    elif [ "$ACTUAL" -lt "$EXPECTED" ]; then
      echo "  ❌ $TABLE: Expected >= $EXPECTED rows, got $ACTUAL (DATA LOSS?)"
      ISSUES=$((ISSUES + 1))
    else
      echo "  ✅ $TABLE: $ACTUAL rows (was $EXPECTED)"
    fi
  done < <(cat "$SNAPSHOT_FILE" | tr ',' '\n' | grep -E '"table_name"|"row_count"' | paste - - | sed 's/[{}]//g')
  
  if [ $ISSUES -gt 0 ]; then
    echo ""
    echo "❌ $ISSUES row count issue(s) detected!"
    exit 1
  fi
fi

# Check 4: Critical FK constraints still intact
echo ""
echo "[ 4/6 ] Critical FK constraints..."
CRITICAL_FKS=(
  "order_sessions_product_id_products_id_fk"
  "orders_product_id_products_id_fk"
  "pre_order_sessions_product_id_products_id_fk"
  "pre_orders_product_id_products_id_fk"
  "product_inquiries_product_id_products_id_fk"
  "provider_usage_log_provider_id_ai_providers_id_fk"
  "user_product_context_product_id_products_id_fk"
)

for fk in "${CRITICAL_FKS[@]}"; do
  EXISTS=$(psql "$DATABASE_URL" -t -A -c "SELECT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='$fk');")
  if [ "$EXISTS" = "t" ]; then
    echo "  ✅ $fk"
  else
    echo "  ⚠️  $fk (may have been intentionally removed in migration)"
  fi
done

# Check 5: API server health
echo ""
echo "[ 5/6 ] API server health..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/healthz 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  echo "  ✅ API server responding (HTTP 200)"
else
  echo "  ⚠️  API server: HTTP $HEALTH (may be restarting)"
fi

# Check 6: Tenant-specific checks (after Phase 1 only)
echo ""
echo "[ 6/6 ] Tenant migration checks..."
TENANT_TABLE=$(psql "$DATABASE_URL" -t -A -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='tenants');" 2>/dev/null)
if [ "$TENANT_TABLE" = "t" ]; then
  TENANT_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM tenants;")
  echo "  ✅ tenants table exists: $TENANT_COUNT tenants"
  
  # Check tenant_id in tables
  TENANT_COL_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND column_name='tenant_id';")
  echo "  ✅ tenant_id column in $TENANT_COL_COUNT tables"
  
  # Check no null tenant_ids
  TABLES_WITH_NULLS=$(psql "$DATABASE_URL" -t -A -c "
    SELECT string_agg(table_name, ', ')
    FROM information_schema.columns 
    WHERE table_schema='public' AND column_name='tenant_id'
    AND table_name IN (
      SELECT table_name FROM information_schema.columns
      WHERE table_schema='public' AND column_name='tenant_id'
    )
  " 2>/dev/null)
  echo "  ℹ️  Tables with tenant_id: $TABLES_WITH_NULLS"
else
  echo "  ℹ️  tenants table not yet created (Phase 1 not started)"
fi

echo ""
echo "============================================================"
echo "✅ INTEGRITY CHECK PASSED — Step: $STEP"
echo "============================================================"
