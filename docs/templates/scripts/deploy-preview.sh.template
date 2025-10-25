#!/bin/bash
set -e

# Deploy to Preview environment
# Uses .deployment-config.json for configuration

# Load deployment helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_deployment-helpers.sh"

# Validate prerequisites
validate_prerequisites

# Load configuration
export_config_vars

echo "🚀 Deploying to Preview Environment"
echo "════════════════════════════════════════════"

CURRENT_BRANCH=$(git branch --show-current)

# Verify on preview or feature branch
if [[ "$CURRENT_BRANCH" != "$PREVIEW_BRANCH" && ! "$CURRENT_BRANCH" =~ ^feature/ ]]; then
    echo "❌ ERROR: Must be on $PREVIEW_BRANCH or feature/* branch"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "❌ ERROR: You have uncommitted changes"
    echo "Commit or stash your changes before deploying"
    git status -s
    exit 1
fi

echo "✅ Branch: $CURRENT_BRANCH"
echo ""

# Run validation
echo "🔍 Running validation..."
npm run validate-production

echo ""
echo "📤 Pushing to remote..."
git push origin "$CURRENT_BRANCH"

# If feature branch, prompt to create PR
if [[ "$CURRENT_BRANCH" =~ ^feature/ ]]; then
    echo ""
    read -p "Create PR to $PREVIEW_BRANCH? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        check_gh_auth
        gh pr create --base "$PREVIEW_BRANCH" --fill || echo "PR may already exist"
    fi
fi

echo ""
echo "⏳ Waiting 90 seconds for Vercel deployment..."
sleep 90

echo ""
echo "🔍 Verifying deployment..."
bash "$SCRIPT_DIR/verify-preview.sh"

echo ""
echo "════════════════════════════════════════════"
echo "✅ Preview deployment complete"
echo "🔗 URL: $PREVIEW_URL"
echo "════════════════════════════════════════════"
