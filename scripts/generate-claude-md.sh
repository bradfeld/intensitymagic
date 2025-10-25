#!/bin/bash
set -euo pipefail

# Generate CLAUDE.md from template + project config
# Usage: ./scripts/generate-claude-md.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_REPO="/Users/bfeld/Code/project-template"

# Check if we're in a project or the template
if [ "$PROJECT_ROOT" = "$TEMPLATE_REPO" ]; then
  echo "⚠️  Running in project-template - skipping (template uses placeholders)"
  exit 0
fi

TEMPLATE_FILE="$TEMPLATE_REPO/CLAUDE.md"
CONFIG_FILE="$PROJECT_ROOT/.claude/PROJECT_CONFIG.md"
OUTPUT_FILE="$PROJECT_ROOT/CLAUDE.md"

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "❌ Template not found: $TEMPLATE_FILE"
  exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Project config not found: $CONFIG_FILE"
  echo "   Create .claude/PROJECT_CONFIG.md with:"
  echo "   ## PROJECT_DESCRIPTION"
  echo "   [Your project description]"
  echo ""
  echo "   ## DOMAIN_SPECIFICS"
  echo "   [Your domain-specific notes]"
  exit 1
fi

# Use Python script for generation
export TEMPLATE_FILE
export CONFIG_FILE
export OUTPUT_FILE

python3 "$SCRIPT_DIR/generate-claude-md.py"
