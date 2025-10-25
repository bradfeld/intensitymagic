# Automatic Configuration Sync

This project uses **dual automation** for syncing global configuration files to ensure consistency across all projects and Claude Code sessions.

## What Gets Synced

The following files sync between project, project-template, and ~/.claude/:

- **settings.json** - Claude Code hooks, MCP enablement (identical across all company projects)
- **GLOBAL_STANDARDS.md** - Universal coding standards
- **mcp.json** - MCP server definitions (Linear, Supabase, Figma)
- **CONFIG_SYNC_README.md** - This documentation
- **CLAUDE.md** - 95% synced via template, 5% project-specific via PROJECT_CONFIG.md
- **docs/standards/** - All development standards
- **src/*/CLAUDE.md** - Implementation patterns
- **scripts/** - Sync and deployment scripts
- **.github/workflows/** - CI/CD workflows
- **.husky/** - Git hooks

## How It Works

### Two Levels of Automation

#### 1. Local Automation (Git Hooks)

**After committing changes** to GLOBAL_STANDARDS.md or mcp.json:

- Post-commit hook automatically copies to `~/.claude/`
- Changes are immediately available to all Claude Code sessions

**After pulling/merging** changes from project-template:

- Post-merge hook automatically copies to `~/.claude/`
- Your global config stays current with the latest standards

#### 2. Cross-Repo Automation (GitHub Actions)

**When you push config changes to medicaremagic**:

- GitHub Actions creates a PR in project-template
- You review and merge to share with all projects

**When project-template is updated**:

- GitHub Actions creates a PR in medicaremagic (and other projects)
- You review and merge to get latest updates

**See `docs/ops/GITHUB_SYNC_SETUP.md` for setup instructions**

### Manual Sync (Override/Fallback)

**Push changes to project-template** (share with other projects):

```bash
./scripts/sync-config.sh push
cd /Users/bfeld/Code/project-template
git add .claude/GLOBAL_STANDARDS.md .claude/mcp.json
git commit -m "Update global standards"
git push
```

**Pull latest from project-template** (get updates from other projects):

```bash
./scripts/sync-config.sh pull
# Review changes
git add .claude/
git commit -m "Sync latest config from project-template"
```

## File Locations

```
~/.claude/GLOBAL_STANDARDS.md      ← Global config (used by Claude Code)
~/.claude/mcp.json                 ← Global MCP definitions

/Code/project-template/            ← Source of truth (GitHub)
  .claude/GLOBAL_STANDARDS.md      ← Master copy
  .claude/mcp.json                 ← Master copy

/Code/medicaremagic/               ← This project
  .claude/GLOBAL_STANDARDS.md      ← Synced from template
  .claude/mcp.json                 ← Synced from template
  .husky/post-commit               ← Auto-sync on commit
  .husky/post-merge                ← Auto-sync on pull
```

## Creating New Projects

New projects automatically get the latest standards:

```bash
cd /Users/bfeld/Code/project-template
./scripts/sync-config.sh init new-project-name
```

This initializes a new project with:

- Latest GLOBAL_STANDARDS.md
- Latest mcp.json
- All git hooks configured
- Automatic sync enabled

## Important Notes

1. **GLOBAL_STANDARDS.md should NEVER be customized per-project** - it's meant to be identical everywhere
2. **Changes sync automatically** - no manual copying needed after commits
3. **Project-template is the source of truth** - push significant changes there
4. **~/.claude/ is global** - changes there affect ALL Claude Code sessions

## Testing the Sync

To verify sync is working:

```bash
# Make a test change
echo "# Test" >> .claude/GLOBAL_STANDARDS.md
git add .claude/GLOBAL_STANDARDS.md
git commit -m "Test sync"

# Check it synced to global
tail ~/.claude/GLOBAL_STANDARDS.md  # Should show "# Test"

# Revert
git revert HEAD

# Check it synced the revert
tail ~/.claude/GLOBAL_STANDARDS.md  # Should NOT show "# Test"
```

## Troubleshooting

**Sync didn't trigger:**

- Check that git hooks are executable: `ls -la .husky/post-commit .husky/post-merge`
- Verify hooks exist in both project-template and this project
- Re-run: `npx husky install`

**Files out of sync:**

- Pull latest from project-template: `./scripts/sync-config.sh pull`
- Manually copy: `cp .claude/GLOBAL_STANDARDS.md ~/.claude/`

**Want to disable auto-sync:**

- Remove or comment out the hooks in `.husky/post-commit` and `.husky/post-merge`
- (Not recommended - breaks standardization across projects)
