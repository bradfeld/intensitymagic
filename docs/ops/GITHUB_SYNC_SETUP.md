# GitHub Actions Automated Sync Setup

This guide explains how to configure the automated sync system between `project-template` and individual projects (like `medicaremagic`).

## Overview

The sync system uses GitHub Actions to automatically sync configuration files between repositories:

1. **medicaremagic → project-template**: When config files change in medicaremagic, a PR is created in project-template
2. **project-template → medicaremagic**: When project-template is updated, a PR is created in medicaremagic

## Prerequisites

- Admin access to both repositories
- Ability to create Personal Access Tokens (PATs)

## Setup Steps

### 1. Create Personal Access Tokens

You need two PATs with `repo` scope:

#### PAT #1: PROJECT_TEMPLATE_PAT
Used by medicaremagic to create PRs in project-template.

1. Go to https://github.com/settings/tokens/new
2. Token name: `medicaremagic-to-template-sync`
3. Expiration: `No expiration` (or 1 year with reminder)
4. Scopes: Select `repo` (full control of private repositories)
5. Click **Generate token**
6. **Copy the token immediately** (you won't see it again)

#### PAT #2: MEDICAREMAGIC_PAT
Used by project-template to trigger workflows in medicaremagic.

1. Go to https://github.com/settings/tokens/new
2. Token name: `template-to-medicaremagic-sync`
3. Expiration: `No expiration` (or 1 year with reminder)
4. Scopes: Select `repo` (full control of private repositories)
5. Click **Generate token**
6. **Copy the token immediately**

### 2. Add Secrets to Repositories

#### In medicaremagic repository:

1. Go to https://github.com/bradfeld/medicaremagic/settings/secrets/actions
2. Click **New repository secret**
3. Name: `PROJECT_TEMPLATE_PAT`
4. Value: Paste the first PAT (from step 1.1)
5. Click **Add secret**

#### In project-template repository:

1. Go to https://github.com/bradfeld/project-template/settings/secrets/actions
2. Click **New repository secret**
3. Name: `MEDICAREMAGIC_PAT`
4. Value: Paste the second PAT (from step 1.2)
5. Click **Add secret**

### 3. Verify Workflows Exist

#### In medicaremagic:
- `.github/workflows/sync-to-template.yml` - Syncs medicaremagic → project-template
- `.github/workflows/sync-from-template.yml` - Receives updates from project-template

#### In project-template:
- `.github/workflows/notify-projects.yml` - Notifies projects when template updates

### 4. Test the Sync

#### Test medicaremagic → project-template:

1. Make a change to a synced file in medicaremagic (e.g., edit `.claude/GLOBAL_STANDARDS.md`)
2. Commit and push to main:
   ```bash
   cd /Users/bfeld/Code/medicaremagic
   git add .claude/GLOBAL_STANDARDS.md
   git commit -m "test: Verify sync to project-template"
   git push
   ```
3. Check Actions tab: https://github.com/bradfeld/medicaremagic/actions
4. Verify workflow `Sync Config to Template` runs successfully
5. Check project-template for new PR: https://github.com/bradfeld/project-template/pulls

#### Test project-template → medicaremagic:

1. Merge the PR in project-template (or make a direct change)
2. Check Actions tab: https://github.com/bradfeld/project-template/actions
3. Verify workflow `Notify Projects of Updates` runs
4. Check medicaremagic Actions: https://github.com/bradfeld/medicaremagic/actions
5. Verify workflow `Sync Config from Template` runs
6. Check medicaremagic for new PR: https://github.com/bradfeld/medicaremagic/pulls

## How It Works

### Workflow 1: medicaremagic → project-template

**Trigger**: Push to `main` branch with changes to synced files

**Process**:
1. Checks out both repos
2. Copies config files from medicaremagic to project-template
3. Creates a PR in project-template
4. You review and merge the PR

**Files synced**: `.claude/*`, `docs/standards/*`, `src/*/CLAUDE.md`, `scripts/*`, `.github/workflows/*`, `.husky/*`

### Workflow 2: project-template → medicaremagic

**Trigger**: Push to `main` branch in project-template (usually after merging sync PR)

**Process**:
1. project-template triggers `repository_dispatch` event in medicaremagic
2. medicaremagic workflow checks out both repos
3. Copies config files from project-template to medicaremagic
4. Regenerates `CLAUDE.md` from template + `PROJECT_CONFIG.md`
5. Creates a PR in medicaremagic
6. You review and merge the PR

## Adding New Projects

When creating a new project (e.g., authormagic):

1. Create new PAT: `template-to-authormagic-sync`
2. Add to project-template secrets as `AUTHORMAGIC_PAT`
3. Uncomment the `notify-authormagic` job in `project-template/.github/workflows/notify-projects.yml`
4. Copy workflow files to authormagic:
   - `.github/workflows/sync-to-template.yml`
   - `.github/workflows/sync-from-template.yml`
5. Create `AUTHORMAGIC_PAT` secret in authormagic (for syncing to template)
6. Test the sync

## Troubleshooting

### Workflow fails with "Resource not accessible by integration"

**Cause**: Missing or incorrect PAT

**Fix**: Verify secrets are configured correctly in repository settings

### PR not created automatically

**Cause**: peter-evans/create-pull-request action failed

**Fix**:
- Check Actions logs for detailed error
- Verify PAT has `repo` scope
- Ensure no conflicting branch exists

### CLAUDE.md not regenerated correctly

**Cause**: Missing PROJECT_CONFIG.md or malformed format

**Fix**:
- Verify `.claude/PROJECT_CONFIG.md` exists in project
- Check format matches expected structure (see template)
- Review workflow logs for python script errors

### Sync workflow not triggering

**Cause**: Changed files don't match `paths` filter

**Fix**: Update `paths` array in workflow YAML if you added new files to sync

## Security Notes

- PATs have full repo access - treat them like passwords
- Never commit PATs to git
- Rotate PATs periodically (set expiration reminder)
- Review PRs before merging (don't auto-merge sync PRs)
- Sync workflows create PRs for review (safety mechanism)

## Manual Sync (Fallback)

If GitHub Actions are unavailable, you can still sync manually:

```bash
# Sync medicaremagic → project-template
cd /Users/bfeld/Code/medicaremagic
./scripts/sync-config.sh push
cd /Users/bfeld/Code/project-template
git add . && git commit -m "Sync from medicaremagic" && git push

# Sync project-template → medicaremagic
cd /Users/bfeld/Code/medicaremagic
./scripts/sync-config.sh pull
git add . && git commit -m "Sync from project-template" && git push
```

---

**Last Updated**: 2025-10-21
