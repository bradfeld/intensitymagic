# Project Template - Default Configuration

**Last Updated**: 2025-10-19
**Purpose**: Master template for all projects (medicaremagic, authormagic, etc.)

This repository contains the canonical configuration for all Brad's projects. When configuration improves in any project, push it here to share across all projects.

---

## 📋 What's In This Template

### Configuration Files
- `.claude/settings.json` - Team settings with security deny rules
- `.claude/commands/` - 5 slash commands (deploy, test-all, clean, migration, check)
- `.claude/HOOKS_SETUP.md` - Hooks documentation
- `.mcp.json.template` - MCP server configuration (customize per project)
- `.gitignore.template` - Standard gitignore

### Documentation
- `CLAUDE.md.template` - Project guide template
- `src/app/CLAUDE.md` - Next.js App Router patterns
- `src/lib/CLAUDE.md` - Supabase/validation/logging patterns
- `src/components/CLAUDE.md` - UI/UX component standards
- `docs/UNIFIED_DEVELOPMENT_STANDARDS.md` - Quick reference (331 lines)
- `docs/CLAUDE.md` - Documentation standards
- `docs/standards/` - 7 comprehensive standard files
- `docs/templates/` - Code and config templates

### Scripts
- `scripts/dev-tools/` - Shared utility scripts
- `scripts/sync-config.sh` - ⭐ Configuration sync script

---

## 🚀 Usage

### Start New Project
```bash
cd /Code/project-template
./scripts/sync-config.sh init <project-name>
```

**Example**:
```bash
cd /Code/project-template
./scripts/sync-config.sh init authormagic

# Then customize:
cd /Code/authormagic
# 1. Create .claude/PROJECT_CONFIG.md with project description and domain specifics
# 2. Run: bash scripts/generate-claude-md.sh to generate CLAUDE.md
# 3. git add . && git commit -m "Initial commit from template"
# 4. gh repo create bfeld/authormagic --private --source=. --push
# 5. Follow docs/ops/GITHUB_SYNC_SETUP.md to configure automated sync
```

### Sync System (Automatic + Manual)

#### Automatic Sync (Recommended)

**GitHub Actions** automatically create PRs when config changes:

- **medicaremagic → project-template**: Push to main triggers PR in template
- **project-template → medicaremagic**: Template updates trigger PR in medicaremagic

**Setup**: See `docs/ops/GITHUB_SYNC_SETUP.md` for configuration steps

#### Manual Sync (Fallback)

**Push changes to project-template** (share with other projects):

```bash
cd /Code/medicaremagic
# ... make improvements to configuration ...

./scripts/sync-config.sh push

# Commit to project-template
cd /Code/project-template
git add .
git commit -m "Sync config from medicaremagic"
git push
```

**Pull latest config to project**:
```bash
cd /Code/authormagic
./scripts/sync-config.sh pull

# Review changes
git diff

# Commit if good
git add .
git commit -m "Sync latest config from project-template"
```

---

## 📁 What Gets Synced

### Synced (Consistent Across Projects) ✅
- `.claude/settings.json` - Security deny rules, permissions
- `.claude/commands/` - Slash commands
- `.claude/HOOKS_SETUP.md` - Documentation
- `docs/UNIFIED_DEVELOPMENT_STANDARDS.md` - Standards
- `docs/CLAUDE.md` - Doc maintenance standards
- `docs/standards/` - All 7 standard files
- `src/*/CLAUDE.md` - Implementation patterns
- `scripts/dev-tools/` - Utility scripts
- `.gitignore` - Standard exclusions

### NOT Synced (Project-Specific) ❌
- `.claude/settings.local.json` - Personal settings (gitignored)
- `.mcp.json` - Each project has different Supabase project refs
- `CLAUDE.md` - Root guide customized per project
- `package.json` - Different dependencies per project
- `src/` code - Actual project code

---

## 🎯 Design Philosophy

**Hub-and-Spoke Model**:
- `/Code/project-template` = The hub (master template)
- Each project = A spoke (can push improvements back)

**Workflow**:
1. Improve config in any project (e.g., medicaremagic)
2. Push to /default (makes it available to all)
3. Pull to other projects when needed
4. Version control /default to track evolution

**Why This Approach?**
- ✅ Simple, explicit, debuggable
- ✅ Projects can be separate git repos
- ✅ Supports project-specific customization
- ✅ Works perfectly for solo developer + AI agents
- ✅ Can automate later if needed (git hooks)

---

## 🔧 Maintenance

### Adding New Synced Files
Edit `scripts/sync-config.sh` and add to `CONFIG_FILES` array:

```bash
declare -a CONFIG_FILES=(
  ".claude/settings.json"
  ".claude/commands"
  # ... existing files ...
  "NEW_FILE_TO_SYNC"  # Add here
)
```

### Adding New Template Files
Add to `TEMPLATE_FILES` array:

```bash
declare -a TEMPLATE_FILES=(
  ".mcp.json.template:.mcp.json"
  # ... existing templates ...
  "new.template:new.file"  # Add here
)
```

---

## 📚 Related Documentation

- `docs/CLAUDE_CODE_CONFIG_REVIEW.md` - Complete config audit
- `docs/CONFIG_SYNC_ARCHITECTURE.md` - Detailed architecture analysis
- `docs/UNIFIED_DEVELOPMENT_STANDARDS.md` - Development standards
- `.claude/HOOKS_SETUP.md` - Hooks documentation

---

## 🤖 For AI Agents

When working on a project:

1. **Check config is current**:
   ```bash
   ./scripts/sync-config.sh pull
   ```

2. **If you improve config**:
   ```bash
   ./scripts/sync-config.sh push
   ```

3. **Starting new project**:
   ```bash
   cd /Code/project-template && ./scripts/sync-config.sh init <name>
   ```

This ensures all projects benefit from configuration improvements.

---

## 🔄 Version History

- 2025-10-19: Initial template created from medicaremagic
  - .claude/settings.json with security deny rules
  - 5 slash commands
  - Hierarchical CLAUDE.md structure
  - 7 comprehensive standard files
  - Sync script for bidirectional config management

---

## 📞 Questions?

See the comprehensive architecture doc:
`docs/CONFIG_SYNC_ARCHITECTURE.md`

This explains all the options considered (monorepo, submodules, symlinks) and why this approach was chosen.
