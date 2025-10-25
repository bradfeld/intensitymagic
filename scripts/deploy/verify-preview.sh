#!/bin/bash
# Verify Preview deployment health
# Uses .deployment-config.json for URLs

# Load deployment helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_deployment-helpers.sh"

# Load configuration
export_config_vars

echo "🔍 Verifying Preview Deployment"
echo "════════════════════════════════════════════"

FAILURES=0

echo "1. Health check..."
if curl -f "$PREVIEW_URL/api/health" --max-time 30 2>/dev/null; then
    echo "   ✅ Passed"
else
    echo "   ❌ Failed"
    ((FAILURES++))
fi

echo "2. Home page..."
if curl -f "$PREVIEW_URL" --max-time 30 2>/dev/null > /dev/null; then
    echo "   ✅ Passed"
else
    echo "   ❌ Failed"
    ((FAILURES++))
fi

echo ""
echo "════════════════════════════════════════════"

if [ $FAILURES -eq 0 ]; then
    echo "✅ All checks passed"
    echo "🔗 Preview URL: $PREVIEW_URL"
    echo "📊 Logs: vercel logs $VERCEL_PROJECT_NAME"
    echo "════════════════════════════════════════════"
    exit 0
else
    echo "❌ $FAILURES check(s) failed"
    echo "🔗 Preview URL: $PREVIEW_URL"
    echo "📊 Logs: vercel logs $VERCEL_PROJECT_NAME"
    echo "════════════════════════════════════════════"
    exit 1
fi
