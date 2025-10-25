#!/bin/bash
set -euo pipefail

# Configuration Sync Script for Brad's Projects
# Syncs configuration between /Code/project-template and individual projects

DEFAULT_PATH="/Users/bfeld/Code/project-template"
CURRENT_PROJECT_PATH="$(pwd)"
PROJECT_NAME="$(basename "$CURRENT_PROJECT_PATH")"

# Options
DRY_RUN=false
CREATE_BACKUP=false
FORCE=false

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|-d)
      DRY_RUN=true
      shift
      ;;
    --backup|-b)
      CREATE_BACKUP=true
      shift
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    *)
      break
      ;;
  esac
done

# Files to sync (consistent across all projects)
# NOTE: All projects for same company = same configuration
#       .claude/settings.json synced globally (identical hooks, MCP enablement)
#       Global user preferences (permissions, UI) in ~/.claude/settings.json or ~/.claude/settings.local.json
declare -a CONFIG_FILES=(
  ".claude/settings.json"
  ".claude/commands"
  ".claude/HOOKS_SETUP.md"
  ".claude/GLOBAL_STANDARDS.md"
  ".claude/CONFIG_SYNC_README.md"
  ".claude/mcp.json"
  "docs/UNIFIED_DEVELOPMENT_STANDARDS.md"
  "docs/CLAUDE.md"
  "docs/standards"
  "docs/templates"
  "docs/ops"
  "src/app/CLAUDE.md"
  "src/lib/CLAUDE.md"
  "src/components/CLAUDE.md"
  "scripts/dev-tools"
  "scripts/deploy"
  "scripts/init-new-project.sh"
  "scripts/sync-config.sh"
  ".github/workflows"
  ".husky"
  "CLAUDE.md"
)

# Template files (copied only during init, then customized per project)
declare -a TEMPLATE_FILES=(
  ".mcp.json.template:.mcp.json"
  ".claude/settings.json.template:.claude/settings.json"
  "CLAUDE.md.template:CLAUDE.md"
  ".gitignore.template:.gitignore"
  ".deployment-config.json.template:.deployment-config.json"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${BLUE}📦 $1${NC}"; }

push_to_default() {
  if [ "$DRY_RUN" = true ]; then
    log_step "DRY RUN: Pushing config from $PROJECT_NAME to /default..."
  else
    log_step "Pushing config from $PROJECT_NAME to /default..."
  fi

  local count=0
  local backup_dir=""

  if [ "$CREATE_BACKUP" = true ] && [ "$DRY_RUN" = false ]; then
    backup_dir="$DEFAULT_PATH/.sync-backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    log_info "  Backup directory: $backup_dir"
  fi

  for file in "${CONFIG_FILES[@]}"; do
    if [ -e "$CURRENT_PROJECT_PATH/$file" ]; then
      target_dir="$DEFAULT_PATH/$(dirname "$file")"

      # Check for conflicts
      if [ -e "$DEFAULT_PATH/$file" ] && [ "$FORCE" = false ]; then
        if ! diff -rq "$CURRENT_PROJECT_PATH/$file" "$DEFAULT_PATH/$file" > /dev/null 2>&1; then
          if [ "$DRY_RUN" = true ]; then
            log_warn "  Would overwrite $file (has local changes)"
          else
            log_warn "  Overwriting $file (has local changes)"
          fi
        fi
      fi

      if [ "$DRY_RUN" = true ]; then
        log_info "  Would copy $file"
      else
        mkdir -p "$target_dir"

        # Create backup if requested
        if [ "$CREATE_BACKUP" = true ] && [ -e "$DEFAULT_PATH/$file" ]; then
          backup_file_dir="$backup_dir/$(dirname "$file")"
          mkdir -p "$backup_file_dir"
          cp -r "$DEFAULT_PATH/$file" "$backup_file_dir/"
        fi

        # Remove destination if it exists (for clean copy)
        if [ -e "$DEFAULT_PATH/$file" ]; then
          rm -rf "$DEFAULT_PATH/$file"
        fi

        cp -r "$CURRENT_PROJECT_PATH/$file" "$DEFAULT_PATH/$file"
        log_info "  Copied $file"
      fi
      ((count++))
    else
      log_warn "  Skipped $file (doesn't exist)"
    fi
  done

  echo ""
  if [ "$DRY_RUN" = true ]; then
    log_info "✨ DRY RUN: Would push $count config files to /default"
    log_warn "💡 Run without --dry-run to actually perform the sync"
  else
    log_info "✨ Pushed $count config files to /default"
    if [ "$CREATE_BACKUP" = true ]; then
      log_info "📦 Backup created at: $backup_dir"
    fi
    log_warn "💡 Don't forget to commit /default if you want to version these changes:"
    echo "    cd /Code/project-template"
    echo "    git add ."
    echo "    git commit -m 'Sync config from $PROJECT_NAME'"
    echo "    git push"
  fi
}

pull_from_default() {
  if [ "$DRY_RUN" = true ]; then
    log_step "DRY RUN: Pulling config from /default to $PROJECT_NAME..."
  else
    log_step "Pulling config from /default to $PROJECT_NAME..."
  fi

  local count=0
  local backup_dir=""

  if [ "$CREATE_BACKUP" = true ] && [ "$DRY_RUN" = false ]; then
    backup_dir="$CURRENT_PROJECT_PATH/.sync-backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    log_info "  Backup directory: $backup_dir"
  fi

  for file in "${CONFIG_FILES[@]}"; do
    if [ -e "$DEFAULT_PATH/$file" ]; then
      target_dir="$CURRENT_PROJECT_PATH/$(dirname "$file")"

      # Check for conflicts
      if [ -e "$CURRENT_PROJECT_PATH/$file" ] && [ "$FORCE" = false ]; then
        if ! diff -rq "$DEFAULT_PATH/$file" "$CURRENT_PROJECT_PATH/$file" > /dev/null 2>&1; then
          if [ "$DRY_RUN" = true ]; then
            log_warn "  Would overwrite $file (has local changes)"
          else
            log_warn "  Overwriting $file (has local changes)"
          fi
        fi
      fi

      if [ "$DRY_RUN" = true ]; then
        log_info "  Would copy $file"
      else
        mkdir -p "$target_dir"

        # Create backup if requested
        if [ "$CREATE_BACKUP" = true ] && [ -e "$CURRENT_PROJECT_PATH/$file" ]; then
          backup_file_dir="$backup_dir/$(dirname "$file")"
          mkdir -p "$backup_file_dir"
          cp -r "$CURRENT_PROJECT_PATH/$file" "$backup_file_dir/"
        fi

        # Remove destination if it exists (for clean copy)
        if [ -e "$CURRENT_PROJECT_PATH/$file" ]; then
          rm -rf "$CURRENT_PROJECT_PATH/$file"
        fi

        cp -r "$DEFAULT_PATH/$file" "$CURRENT_PROJECT_PATH/$file"
        log_info "  Copied $file"
      fi
      ((count++))
    else
      log_warn "  Skipped $file (doesn't exist in /default)"
    fi
  done

  echo ""
  if [ "$DRY_RUN" = true ]; then
    log_info "✨ DRY RUN: Would pull $count config files from /default"
    log_warn "💡 Run without --dry-run to actually perform the sync"
  else
    log_info "✨ Pulled $count config files from /default"
    if [ "$CREATE_BACKUP" = true ]; then
      log_info "📦 Backup created at: $backup_dir"
    fi

    # Generate CLAUDE.md from template + PROJECT_CONFIG
    if [ -f "$CURRENT_PROJECT_PATH/scripts/generate-claude-md.sh" ]; then
      log_step "Generating CLAUDE.md from template..."
      cd "$CURRENT_PROJECT_PATH"
      bash scripts/generate-claude-md.sh || log_warn "  Could not generate CLAUDE.md (PROJECT_CONFIG.md may be missing)"
    fi

    log_warn "💡 Review the changes and commit when ready:"
    echo "    git diff"
    echo "    git add ."
    echo "    git commit -m 'Sync latest config from /default'"
  fi
}

init_project() {
  NEW_PROJECT_NAME="$1"
  NEW_PROJECT_PATH="/Users/bfeld/Code/$NEW_PROJECT_NAME"

  if [ -d "$NEW_PROJECT_PATH" ]; then
    log_error "Project $NEW_PROJECT_NAME already exists at $NEW_PROJECT_PATH"
    exit 1
  fi

  log_step "Initializing new project: $NEW_PROJECT_NAME..."

  mkdir -p "$NEW_PROJECT_PATH"
  cd "$NEW_PROJECT_PATH"

  # Initialize git
  git init -b main
  log_info "  Initialized git repository (main branch)"

  # Copy config files
  local count=0
  for file in "${CONFIG_FILES[@]}"; do
    if [ -e "$DEFAULT_PATH/$file" ]; then
      target_dir="$(dirname "$file")"
      mkdir -p "$target_dir"
      cp -r "$DEFAULT_PATH/$file" "$file"
      log_info "  Copied $file"
      ((count++))
    fi
  done

  # Copy and process template files
  for template_pair in "${TEMPLATE_FILES[@]}"; do
    template="${template_pair%%:*}"
    target="${template_pair##*:}"
    if [ -e "$DEFAULT_PATH/$template" ]; then
      cp "$DEFAULT_PATH/$template" "$target"
      log_info "  Created $target from template"
    fi
  done

  # Create initial README
  cat > README.md << EOF
# $NEW_PROJECT_NAME

Project initialized from /Code/project-template template on $(date +%Y-%m-%d).

## Next Steps

1. Customize \`.mcp.json\` with your Supabase project reference
2. Customize \`CLAUDE.md\` for this project
3. Install dependencies (if applicable): \`npm install\`
4. Create initial commit: \`git add . && git commit -m "Initial commit from template"\`
5. Create GitHub repo: \`gh repo create bfeld/$NEW_PROJECT_NAME --private --source=. --push\`

## Sync Configuration

To pull latest config from /default:
\`\`\`bash
./scripts/sync-config.sh pull
\`\`\`

To push config changes back to /default:
\`\`\`bash
./scripts/sync-config.sh push
\`\`\`
EOF

  echo ""
  log_info "✨ Project $NEW_PROJECT_NAME initialized with $count config files!"
  echo ""
  echo -e "${YELLOW}📝 Next steps:${NC}"
  echo "  1. cd /Code/$NEW_PROJECT_NAME"
  echo "  2. ${YELLOW}Customize .mcp.json${NC} - Replace YOUR_PROJECT_REF with actual Supabase project ID"
  echo "  3. ${YELLOW}Customize CLAUDE.md${NC} - Update project-specific details"
  echo "  4. Run 'npm install' (if Node.js project)"
  echo "  5. Create initial commit:"
  echo "     git add . && git commit -m 'Initial commit from template'"
  echo "  6. Create GitHub repo:"
  echo "     gh repo create bfeld/$NEW_PROJECT_NAME --private --source=. --push"
}

show_usage() {
  echo "Configuration Sync Script for Solo Developer"
  echo ""
  echo "Usage: sync-config.sh [OPTIONS] [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  push        Copy config from current project to /default"
  echo "  pull        Copy config from /default to current project"
  echo "  init <name> Create new project from /default template"
  echo ""
  echo "Options:"
  echo "  -d, --dry-run  Preview changes without modifying files"
  echo "  -b, --backup   Create backup before overwriting files"
  echo "  -f, --force    Skip conflict warnings"
  echo ""
  echo "Examples:"
  echo "  # Preview what would be pushed to /default"
  echo "  ./scripts/sync-config.sh --dry-run push"
  echo ""
  echo "  # Push with automatic backup"
  echo "  ./scripts/sync-config.sh --backup push"
  echo ""
  echo "  # Pull latest config (safe - warns on conflicts)"
  echo "  cd /Code/authormagic"
  echo "  ./scripts/sync-config.sh pull"
  echo ""
  echo "  # Create new project from template"
  echo "  cd /Code/project-template"
  echo "  ./scripts/sync-config.sh init authormagic"
  echo ""
  echo "Files synced:"
  for file in "${CONFIG_FILES[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "Note: .claude/settings.json removed - solo developer setup"
  echo "Settings now in ~/.claude/settings.local.json (global permissions/env)"
  echo "and .claude/settings.local.json (project-specific hooks only)"
}

# Main
case "${1:-}" in
  push)
    if [ "$CURRENT_PROJECT_PATH" == "$DEFAULT_PATH" ]; then
      log_error "You're in /default. Run this from a project directory (e.g., /Code/medicaremagic)."
      exit 1
    fi
    push_to_default
    ;;

  pull)
    if [ "$CURRENT_PROJECT_PATH" == "$DEFAULT_PATH" ]; then
      log_error "You're in /default. Run this from a project directory (e.g., /Code/medicaremagic)."
      exit 1
    fi
    pull_from_default
    ;;

  init)
    if [ -z "${2:-}" ]; then
      log_error "Usage: sync-config.sh init <project-name>"
      exit 1
    fi
    init_project "$2"
    ;;

  help|--help|-h)
    show_usage
    ;;

  *)
    log_error "Unknown command: ${1:-}"
    echo ""
    show_usage
    exit 1
    ;;
esac
