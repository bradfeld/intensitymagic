#!/bin/bash
# Verify Production deployment health
# Uses .deployment-config.json for URLs

# Load deployment helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_deployment-helpers.sh"

# Load configuration
export_config_vars

echo "🔍 Verifying Production Deployment"
echo "════════════════════════════════════════════"

FAILURES=0

echo "1. Health check..."
if curl -f "$PRODUCTION_URL/api/health" --max-time 30 2>/dev/null; then
    echo "   ✅ Passed"
else
    echo "   ❌ Failed"
    ((FAILURES++))
fi

echo "2. Home page..."
if curl -f "$PRODUCTION_URL" --max-time 30 2>/dev/null > /dev/null; then
    echo "   ✅ Passed"
else
    echo "   ❌ Failed"
    ((FAILURES++))
fi

echo "3. Auth system..."
if curl -f "$PRODUCTION_URL/sign-in" --max-time 30 2>/dev/null > /dev/null; then
    echo "   ✅ Passed"
else
    echo "   ❌ Failed"
    ((FAILURES++))
fi

echo ""
echo "════════════════════════════════════════════"

if [ $FAILURES -eq 0 ]; then
    echo "✅ All checks passed"
    echo "🔗 Production URL: $PRODUCTION_URL"
    echo "📊 Logs: vercel logs --prod $VERCEL_PROJECT_NAME"
    echo "🔍 Monitor for errors in first 15 minutes"
    echo "════════════════════════════════════════════"
    exit 0
else
    echo "❌ $FAILURES check(s) failed"
    echo "🔗 Production URL: $PRODUCTION_URL"
    echo "📊 Logs: vercel logs --prod $VERCEL_PROJECT_NAME"
    echo "🚨 ROLLBACK IMMEDIATELY - See docs/ops/ROLLBACK_PROCEDURES.md"
    echo "════════════════════════════════════════════"
    exit 1
fi
