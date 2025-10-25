# Template System

This project serves as a comprehensive template for Next.js applications with the three-tier deployment pipeline.

## Quick Start

```bash
./scripts/init-new-project.sh my-new-project
```

This initializes a new project with all template files and prompts for configuration.

## What's Included

### Deployment Pipeline

- Three-tier workflow (Local → Preview → Production)
- Automated deployment scripts
- GitHub Actions CI/CD
- Branch protection configuration
- Pre-commit/pre-push hooks

### Templates

**Scripts** (`docs/templates/scripts/`):

- `_deployment-helpers.sh.template` - Configuration helpers
- `deploy-preview.sh.template` - Preview deployment
- `deploy-production.sh.template` - Production deployment
- `verify-preview.sh.template` - Preview health checks
- `verify-production.sh.template` - Production health checks

**Configs** (`docs/templates/configs/`):

- `.deployment-config.json.template` - Deployment configuration
- `.gitleaks.toml` - Secret scanning
- `.prettierrc` - Code formatting
- `tsconfig.base.json` - TypeScript base config

**Code** (`docs/templates/code/`):

- `three-tier-pipeline.yml.template` - GitHub Actions workflow
- `api-route.template.ts` - API route example
- `middleware.template.ts` - Next.js middleware
- Others...

## Configuration System

All deployment settings are centralized in `.deployment-config.json`:

```json
{
  "projectName": "my-project",
  "github": {
    "owner": "username",
    "repo": "my-project"
  },
  "vercel": {
    "projectName": "my-project",
    "previewUrl": "https://...",
    "productionUrl": "https://..."
  },
  "environments": {
    "preview": { ... },
    "production": { ... }
  }
}
```

All scripts read from this file, making the pipeline portable across projects.

## Using Templates

Templates use `{{PLACEHOLDER}}` syntax. The init script replaces:

- `{{PROJECT_NAME}}` - Project name
- `{{GITHUB_OWNER}}` - GitHub username/org
- `{{GITHUB_REPO}}` - Repository name
- `{{VERCEL_PROJECT_NAME}}` - Vercel project name
- `{{VERCEL_TEAM}}` - Vercel team slug
- `{{PRODUCTION_DOMAIN}}` - Production domain
- `{{SUPABASE_PREVIEW_REF}}` - Preview Supabase project
- `{{SUPABASE_PRODUCTION_REF}}` - Production Supabase project

## Maintaining Templates

When updating the deployment pipeline:

1. Update actual files in project root
2. Update template versions in `docs/templates/`
3. Test with a new project initialization
4. Update this README

## Prerequisites

Required tools:

- Node.js 18+
- npm
- git
- GitHub CLI (`gh`)
- jq (JSON processor)
- Vercel CLI (optional, for deployment inspection)
