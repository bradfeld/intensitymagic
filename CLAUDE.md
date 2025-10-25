# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository. For universal coding standards, see `~/.claude/GLOBAL_STANDARDS.md`. For detailed implementation patterns, see directory-specific CLAUDE.md files and `docs/standards/`.

## Project Overview

**IntensityMagic** is a simple landing page for Intensity Magic company.

**Simplified Stack**: This project uses a minimal configuration:

- Next.js 15 for the framework
- Tailwind CSS + shadcn/ui for styling
- Linear for task management (team: intensitymagic)
- No authentication (Clerk removed)
- No database (Supabase removed)
- No AI features (OpenAI removed)

## Commands

### Development

```bash
npm run dev                     # Start dev server on localhost:3000
npm run restart                 # Clean restart dev server
npm run type-check:watch        # Real-time TypeScript error detection
```

### Testing & Validation

```bash
npm run validate-production     # Complete validation (type-check + lint + build)
npm run build                   # Build for production (MUST pass before deploying)
npm run test                    # Run Node.js tests
npm run test:e2e                # Run Playwright tests
```

### Code Quality

```bash
npm run lint                    # ESLint validation
npm run format                  # Format with Prettier
```

### Linear Integration

```bash
npm run linear:complete         # Mark issue complete
```

## Core Workflow Principles

**See `~/.claude/GLOBAL_STANDARDS.md`** for universal principles (permission protocols, planning-first development, git conventions, code quality).

**Project-Specific**:

- Use TodoWrite tool to track implementation progress
- Reference Linear for strategic task tracking
- Create "MASTER PLAN" summaries for complex multi-step projects

## Tech Stack

- **Framework**: Next.js 15 (App Router only)
- **Styling**: Tailwind CSS + shadcn/ui
- **Task Management**: Linear (team: intensitymagic)
- **Deployment**: Vercel

## Architecture Quick Reference

**See `docs/UNIFIED_DEVELOPMENT_STANDARDS.md`** for comprehensive patterns.

### Key Patterns

- **Validation**: Use `useValidatedForm` with Zod schemas for forms → See `src/lib/CLAUDE.md`
- **TypeScript**: Strict mode with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` → See `docs/standards/TYPESCRIPT_STRICT_MODE.md`
- **Styling**: Use Tailwind CSS classes and shadcn/ui components

## Directory Structure & Context

```
src/
├── app/              # Next.js App Router → See src/app/CLAUDE.md
├── components/       # UI components → See src/components/CLAUDE.md
└── lib/              # Core utilities → See src/lib/CLAUDE.md
    ├── validation/   # Zod schemas
    ├── types/        # TypeScript definitions
    └── utils/        # Helper functions
```

**Read the directory-specific CLAUDE.md file when working in that area.**

## Critical Development Rules

### Three-Tier Deployment Pipeline (MANDATORY)

**Workflow**: Local → Preview → Production

```bash
# 1. Local Development & Testing
npm run dev                  # Test at localhost:3000
npm run validate-production  # Must pass before deploying

# 2. Deploy to Preview (staging)
git checkout preview
git merge feature/my-feature
npm run deploy:preview      # Automated deployment + verification

# 3. Test in Preview
npm run verify:preview      # Health checks

# 4. Deploy to Production (requires user approval)
npm run deploy:production   # Creates PR, requires manual merge
npm run verify:production   # Verify after merge
```

**Protection**:

- ❌ Direct pushes to `main` blocked by git hook
- ✅ All changes must go through Preview first
- ✅ GitHub Actions enforces quality checks
- ✅ Production requires Preview health check + PR approval

**See `docs/ops/THREE_TIER_DEPLOYMENT_PIPELINE.md` for complete guide.**

### Pre-Deployment Checklist

- [ ] `npm run validate-production` passes
- [ ] Manual testing in localhost:3000 complete
- [ ] Tested in Preview environment
- [ ] Health checks pass in Preview
- [ ] User approval obtained for Production
- [ ] Production deployment verified

### Git & Deployment

- **Branch naming**: `feature/description`, `fix/description`, `refactor/description`
- **Deployment branches**: `preview` (staging), `main` (production)
- **Secret scanning**: Gitleaks pre-commit hook prevents committing secrets
- **Never commit**: `.env.local`, secrets, build artifacts
- See `~/.claude/GLOBAL_STANDARDS.md` for git conventions

## Common Pitfalls

1. **Hardcoded localhost URLs** - Use `request.url` origin
2. **Missing type narrowing** - Array access needs null checks
3. **Forgotten build validation** - Always `npm run build` before deploying

## Troubleshooting

**Port 3000 in use**: `lsof -ti:3000 | xargs kill -9 && npm run dev`
**Stale build**: `rm -rf .next && npm run build`

For detailed troubleshooting, see `docs/TROUBLESHOOTING.md` (if exists) or relevant standard file.

## Key Documentation

**Implementation Details**:

- `src/app/CLAUDE.md` - Next.js App Router patterns
- `src/lib/CLAUDE.md` - Supabase, validation, logger usage
- `src/components/CLAUDE.md` - UI/UX component standards
- `docs/UNIFIED_DEVELOPMENT_STANDARDS.md` - Comprehensive patterns

**Standards** (in `docs/standards/`):

- `TYPESCRIPT_STRICT_MODE.md` - Strict TypeScript configuration
- `SECURITY_BEST_PRACTICES.md` - Security guidelines
- `API_STANDARDS.md` - API patterns
- `DATABASE_PATTERNS.md` - Database best practices
- `LOGGING_GUIDE.md` - Logging standards
- `VALIDATION_PATTERNS.md` - Form validation
- `TESTING_STRATEGY.md` - Testing approach

**Project Context**:

- `docs/README.md` - Tech stack details
- `docs/db/` - Database schema documentation
- `docs/TEMPLATE_USAGE.md` - Using as template

## Slash Commands

- `/validate` - Run production validation
- `/schema-check` - Verify database schema
- `/deploy` - Full deployment workflow
- `/test-all` - Run all tests
- `/clean` - Clean build and restart
- `/migration` - Database migration helper
- `/check` - Pre-commit checks

## Agent Usage

**Launch agents for**:

- **Code review** - After completing features (code-reviewer agent)
- **Codebase exploration** - Finding patterns across many files (Explore agent)
- **Complex analysis** - Multi-file refactoring impact (general-purpose agent)

**Example**: After implementing a feature, launch code-reviewer agent to catch issues before commit.

---

**Remember**: This is the high-level guide. For implementation details, always check the directory-specific CLAUDE.md file and relevant docs/standards/ files.
