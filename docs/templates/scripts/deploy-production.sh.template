#!/bin/bash
set -e

# Deploy to Production environment
# Uses .deployment-config.json for configuration

# Load deployment helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_deployment-helpers.sh"

# Validate prerequisites
validate_prerequisites
check_gh_auth

# Load configuration
export_config_vars

echo "🚀 Deploying to PRODUCTION"
echo "════════════════════════════════════════════"
echo "⚠️  WARNING: This affects live users"
echo ""

CURRENT_BRANCH=$(git branch --show-current)

# MUST be on preview branch
if [[ "$CURRENT_BRANCH" != "$PREVIEW_BRANCH" ]]; then
    echo "❌ ERROR: Production deploys must come from $PREVIEW_BRANCH branch"
    echo "Current branch: $CURRENT_BRANCH"
    echo ""
    echo "Run: git checkout $PREVIEW_BRANCH"
    exit 1
fi

# Verify Preview is healthy
echo "🏥 Verifying Preview environment health..."
if ! curl -f "$PREVIEW_URL/api/health" --max-time 30 2>/dev/null; then
    echo "❌ ERROR: Preview health check failed"
    echo "Fix Preview before deploying to Production"
    exit 1
fi
echo "✅ Preview is healthy"
echo ""

# Pre-deployment checklist
echo "════════════════════════════════════════════"
echo "📋 Production Deployment Checklist"
echo "════════════════════════════════════════════"
echo "   ✅ Preview thoroughly tested?"
echo "   ✅ User testing complete?"
echo "   ✅ No critical bugs in Preview logs?"
echo "   ✅ Database migrations tested in Preview?"
echo "   ✅ Performance acceptable in Preview?"
echo ""
read -p "All checks passed? Type 'yes' to continue: " -r
if [[ ! $REPLY == "yes" ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Pull latest preview
echo ""
echo "📥 Pulling latest $PREVIEW_BRANCH..."
git pull origin "$PREVIEW_BRANCH"

# Final validation
echo "🔍 Running final validation..."
npm run validate-production

# Create production PR
echo ""
echo "📝 Creating Production PR..."
gh pr create --base "$PRODUCTION_BRANCH" --head "$PREVIEW_BRANCH" \
  --title "Release to production" \
  --body "## Testing
- ✅ Preview testing complete
- ✅ User acceptance testing complete
- ✅ Database migrations verified in Preview
- ✅ No critical errors in logs

## Deployment
Merging this PR will deploy to production.
URL: $PRODUCTION_URL

## Post-Deployment
- Run: npm run verify:production
- Monitor: vercel logs --prod $VERCEL_PROJECT_NAME" \
  || echo "PR may already exist - check GitHub"

echo ""
echo "════════════════════════════════════════════"
echo "Next steps:"
echo "  1. Review and approve the PR on GitHub"
echo "  2. Merge the PR"
echo "  3. Wait 60-90 seconds for deployment"
echo "  4. Run: npm run verify:production"
echo "════════════════════════════════════════════"
