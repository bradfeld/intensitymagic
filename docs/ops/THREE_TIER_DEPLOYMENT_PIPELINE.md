# Three-Tier Deployment Pipeline

**Status:** ✅ Fully Operational
**Last Updated:** October 19, 2025
**Pipeline Version:** 2.0 (Preview-based workflow)

> **Note**: This documentation describes the MedicareMagic project configuration.
> If you're using this as a template for a new project, your URLs and project refs will differ.
> See `.deployment-config.json` for your project's specific configuration.

## Overview

MedicareMagic uses a three-tier deployment pipeline with complete database isolation:

- **Local**: Local development with testing
- **Preview**: Pre-production testing on dedicated Supabase instance
- **Production**: Live application with production Supabase instance

## Environment Configuration

| Environment    | Branch    | URL                                                       | Supabase Project       | Clerk Instance     | Database            |
| -------------- | --------- | --------------------------------------------------------- | ---------------------- | ------------------ | ------------------- |
| **Local**      | Any       | `localhost:3000`                                          | Local/dev              | Development (test) | Local development   |
| **Preview**    | `preview` | `medicaremagic-git-preview-bradfelds-projects.vercel.app` | `byjniagtgbzdpmrfqzed` | Preview            | Isolated preview    |
| **Production** | `main`    | `getmedicaremagic.com`                                    | `bsuotftwneabfqtrhviq` | Production (live)  | Isolated production |

**No data is shared between environments.**

## Quick Start

```bash
# Deploy to Preview
npm run deploy:preview

# Deploy to Production
npm run deploy:production

# Verify deployments
npm run verify:preview
npm run verify:production
```

## Detailed Workflow

### 1. Local Development

```bash
# Create feature branch
git checkout preview
git pull origin preview
git checkout -b feature/my-feature

# Develop and test
npm run dev  # Runs on localhost:3000

# Validate before committing
npm run validate-production  # type-check + lint + build

# Commit changes
git add .
git commit -m "Add feature"
```

**Local uses:**

- `.env.local` for configuration
- Development/local Supabase
- Clerk development instance

### 2. Deploy to Preview

```bash
# Merge to preview
git checkout preview
git merge feature/my-feature

# Deploy
npm run deploy:preview
```

**What `deploy:preview` does:**

1. Validates branch (must be `preview` or `feature/*`)
2. Checks for uncommitted changes
3. Runs `npm run validate-production`
4. Pushes to remote (triggers Vercel)
5. Waits 90 seconds for deployment
6. Runs automated verification

**Preview Environment:**

- Isolated Supabase (`byjniagtgbzdpmrfqzed`)
- Isolated Clerk (Preview instance)
- Environment variables from Vercel (Preview scope)
- Auto-deploys on push to `preview` branch

### 3. Test in Preview

```bash
# Automated checks
npm run verify:preview

# Manual testing:
# ✅ Core user flows
# ✅ Database migrations
# ✅ Authentication
# ✅ Forms
# ✅ API endpoints
# ✅ Performance
```

**Health checks verify:**

- `/api/health` endpoint responds
- Home page loads
- Auth system works

### 4. Deploy to Production

```bash
# Must be on preview branch
git checkout preview
npm run deploy:production
```

**What `deploy:production` does:**

1. Validates current branch is `preview`
2. Checks Preview environment health
3. Shows deployment checklist
4. Requires explicit confirmation
5. Pulls latest from `preview`
6. Runs `npm run validate-production`
7. Creates PR from `preview` → `main`

**Then manually:**

1. Review PR on GitHub
2. Wait for status checks (`quality-check`, `production-gate`)
3. Approve PR (1 approval required)
4. Merge PR
5. Wait 60-90 seconds for Vercel deployment
6. Run `npm run verify:production`

## Protection Mechanisms

### Git Hooks

Pre-push hook (`.husky/pre-push`):

- ❌ Blocks direct pushes to `main`
- ⚠️ Warns when pushing feature branches to preview

### GitHub Actions

**quality-check** (all PRs):

- Type checking
- Linting
- Build verification

**production-gate** (PRs to main):

- Verifies source branch is `preview`
- Checks Preview environment health
- Shows deployment checklist

### Branch Protection

Configure manually: https://github.com/bradfeld/medicaremagic/settings/branches

Run for instructions:

```bash
bash scripts/setup/configure-branch-protection.sh
```

**Preview branch:**

- Require status checks: `quality-check`
- Require conversation resolution
- No force pushes
- No deletion

**Main branch:**

- Require pull request (1 approval)
- Require status checks: `quality-check`, `production-gate`
- Require linear history
- Dismiss stale reviews
- Require conversation resolution
- No force pushes
- No deletion

## Database Migrations

**ALWAYS** test migrations in Preview before Production.

### Workflow

```bash
# 1. Create migration (use Supabase MCP or CLI)

# 2. Deploy to Preview
npm run deploy:preview

# 3. Verify migration in Preview
# Check Supabase dashboard, test queries

# 4. Deploy to Production
npm run deploy:production
# Migration runs automatically on Production
```

### Safety Rules

- ✅ Test migrations in Preview first
- ✅ Verify data integrity
- ✅ Have rollback plan
- ❌ Never skip Preview testing
- ❌ Never apply directly to Production

## Environment Variables

Managed in Vercel dashboard per environment.

### Local (`.env.local`)

- Clerk development keys
- Supabase local/dev credentials
- OpenAI API key

### Preview (Vercel - Preview scope)

- Clerk Preview instance
- Supabase Preview (`byjniagtgbzdpmrfqzed`)
- OpenAI API key

### Production (Vercel - Production scope)

- Clerk Production instance
- Supabase Production (`bsuotftwneabfqtrhviq`)
- OpenAI API key

### CI/CD (GitHub Actions)

Dummy values only (for build verification):

- Set in `.github/workflows/three-tier-pipeline.yml`
- Not used at runtime

## Troubleshooting

### Build fails in CI

```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Preview deployment fails

```bash
# Check logs
vercel logs medicaremagic

# List deployments
vercel ls medicaremagic

# Inspect specific deployment
vercel inspect <url>
```

### Pre-push hook blocks push

Follow the workflow - don't try to bypass:

```bash
git checkout preview
git merge your-branch
npm run deploy:preview
```

## Scripts Reference

| Script                        | Purpose                  |
| ----------------------------- | ------------------------ |
| `npm run deploy:preview`      | Deploy to Preview        |
| `npm run deploy:production`   | Create Production PR     |
| `npm run verify:preview`      | Verify Preview health    |
| `npm run verify:production`   | Verify Production health |
| `npm run validate-production` | Run all validation       |

## Files Reference

| File                                           | Purpose                  |
| ---------------------------------------------- | ------------------------ |
| `scripts/deploy/deploy-preview.sh`             | Preview deployment       |
| `scripts/deploy/deploy-production.sh`          | Production deployment    |
| `scripts/deploy/verify-preview.sh`             | Preview health checks    |
| `scripts/deploy/verify-production.sh`          | Production health checks |
| `scripts/setup/configure-branch-protection.sh` | Branch protection guide  |
| `.github/workflows/three-tier-pipeline.yml`    | CI/CD automation         |
| `.husky/pre-push`                              | Git push protection      |

## Best Practices

### DO

- ✅ Test in Preview before Production
- ✅ Run validation before pushing
- ✅ Test migrations in Preview
- ✅ Verify health checks
- ✅ Monitor after deployment
- ✅ Use feature branches

### DON'T

- ❌ Push directly to `main`
- ❌ Skip Preview testing
- ❌ Apply migrations to Production first
- ❌ Deploy without validation
- ❌ Ignore failing health checks

## URLs

- **Preview**: https://medicaremagic-git-preview-bradfelds-projects.vercel.app
- **Production**: https://getmedicaremagic.com
- **Health Endpoint**: `/api/health` (no auth)

---

**Changelog:**

- 2025-10-19: Updated to preview-based workflow, added automated scripts
- 2025-10-11: Initial three-tier documentation
