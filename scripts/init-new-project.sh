#!/bin/bash

# init-new-project.sh
# Initialize a new project from the MedicareMagic template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  MedicareMagic Template Initialization  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}\n"

# Check if project name provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project name required${NC}"
    echo "Usage: ./scripts/init-new-project.sh <project-name>"
    echo "Example: ./scripts/init-new-project.sh my-new-project"
    exit 1
fi

PROJECT_NAME="$1"
TEMPLATE_DIR="$(pwd)"
NEW_PROJECT_DIR="../${PROJECT_NAME}"

# Validate project name
if [[ ! "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}Error: Project name must be lowercase letters, numbers, and hyphens only${NC}"
    exit 1
fi

# Check if target directory already exists
if [ -d "$NEW_PROJECT_DIR" ]; then
    echo -e "${RED}Error: Directory $NEW_PROJECT_DIR already exists${NC}"
    exit 1
fi

# Check for required tools
echo -e "${BLUE}Checking prerequisites...${NC}"
MISSING_TOOLS=()

if ! command -v node &> /dev/null; then
    MISSING_TOOLS+=("node")
fi

if ! command -v jq &> /dev/null; then
    MISSING_TOOLS+=("jq")
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing required tools:${NC}"
    for tool in "${MISSING_TOOLS[@]}"; do
        echo "  - $tool"
    done
    echo ""
    echo "Install missing tools before continuing."
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}\n"

echo -e "${YELLOW}Project: $PROJECT_NAME${NC}"
echo -e "Template: MedicareMagic"
echo -e "Location: $NEW_PROJECT_DIR\n"

# ═══════════════════════════════════════════════════════════
# Deployment Configuration Prompts
# ═══════════════════════════════════════════════════════════

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Deployment Configuration (Three-Tier)  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}This project uses a three-tier deployment pipeline:${NC}"
echo -e "  Local → Preview (staging) → Production\n"

# GitHub Configuration
echo -e "${GREEN}GitHub Configuration:${NC}"
read -p "GitHub username/org: " GITHUB_OWNER
read -p "Repository name [$PROJECT_NAME]: " GITHUB_REPO
GITHUB_REPO=${GITHUB_REPO:-$PROJECT_NAME}

echo ""

# Vercel Configuration
echo -e "${GREEN}Vercel Configuration:${NC}"
read -p "Vercel project name [$PROJECT_NAME]: " VERCEL_PROJECT_NAME
VERCEL_PROJECT_NAME=${VERCEL_PROJECT_NAME:-$PROJECT_NAME}

read -p "Vercel team slug (your-username or team-name): " VERCEL_TEAM

read -p "Production domain (e.g., myapp.com): " PRODUCTION_DOMAIN

echo ""

# Supabase Configuration
echo -e "${GREEN}Supabase Configuration:${NC}"
echo -e "${YELLOW}You'll need two Supabase projects (Preview + Production)${NC}"
echo -e "Leave blank to configure later\n"

read -p "Preview Supabase project ref (optional): " SUPABASE_PREVIEW_REF
read -p "Production Supabase project ref (optional): " SUPABASE_PRODUCTION_REF

# Set defaults if not provided
SUPABASE_PREVIEW_REF=${SUPABASE_PREVIEW_REF:-"YOUR_PREVIEW_PROJECT_REF"}
SUPABASE_PRODUCTION_REF=${SUPABASE_PRODUCTION_REF:-"YOUR_PRODUCTION_PROJECT_REF"}

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Configuration Summary  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "Project:     $PROJECT_NAME"
echo -e "GitHub:      $GITHUB_OWNER/$GITHUB_REPO"
echo -e "Vercel:      $VERCEL_PROJECT_NAME"
echo -e "Production:  https://$PRODUCTION_DOMAIN"
echo -e "Preview:     https://$VERCEL_PROJECT_NAME-git-preview-$VERCEL_TEAM.vercel.app"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

# Confirm with user
read -p "Continue with these settings? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# ═══════════════════════════════════════════════════════════
# Step 1: Copy Template Files
# ═══════════════════════════════════════════════════════════

echo -e "\n${GREEN}[1/8] Copying template files...${NC}"
cp -r "$TEMPLATE_DIR" "$NEW_PROJECT_DIR"
cd "$NEW_PROJECT_DIR"

# ═══════════════════════════════════════════════════════════
# Step 2: Clean Template-Specific Files
# ═══════════════════════════════════════════════════════════

echo -e "${GREEN}[2/8] Cleaning template-specific files...${NC}"
rm -rf .git
rm -rf node_modules .next
rm -f .env.local .env.production .env.production.local
rm -f docs/plans/* 2>/dev/null || true
rm -f docs/archive/* 2>/dev/null || true
rm -f .deployment-config.json  # Will create new one

# ═══════════════════════════════════════════════════════════
# Step 3: Create Deployment Configuration
# ═══════════════════════════════════════════════════════════

echo -e "${GREEN}[3/8] Creating deployment configuration...${NC}"

cat > .deployment-config.json << EOF
{
  "projectName": "$PROJECT_NAME",
  "github": {
    "owner": "$GITHUB_OWNER",
    "repo": "$GITHUB_REPO"
  },
  "vercel": {
    "projectName": "$VERCEL_PROJECT_NAME",
    "previewUrl": "https://$VERCEL_PROJECT_NAME-git-preview-$VERCEL_TEAM.vercel.app",
    "productionUrl": "https://$PRODUCTION_DOMAIN"
  },
  "environments": {
    "preview": {
      "branch": "preview",
      "supabaseProjectRef": "$SUPABASE_PREVIEW_REF",
      "clerkInstance": "preview"
    },
    "production": {
      "branch": "main",
      "supabaseProjectRef": "$SUPABASE_PRODUCTION_REF",
      "clerkInstance": "production"
    }
  }
}
EOF

# ═══════════════════════════════════════════════════════════
# Step 4: Copy Template Scripts to Actual Locations
# ═══════════════════════════════════════════════════════════

echo -e "${GREEN}[4/8] Setting up deployment scripts...${NC}"

# Validate template files exist
TEMPLATE_SCRIPTS=(
  "_deployment-helpers.sh"
  "deploy-preview.sh"
  "deploy-production.sh"
  "verify-preview.sh"
  "verify-production.sh"
)

MISSING_TEMPLATES=()
for script in "${TEMPLATE_SCRIPTS[@]}"; do
  if [[ ! -f "docs/templates/scripts/${script}.template" ]]; then
    MISSING_TEMPLATES+=("docs/templates/scripts/${script}.template")
  fi
done

if [[ ! -f "docs/templates/code/three-tier-pipeline.yml.template" ]]; then
  MISSING_TEMPLATES+=("docs/templates/code/three-tier-pipeline.yml.template")
fi

if [ ${#MISSING_TEMPLATES[@]} -gt 0 ]; then
  echo -e "${RED}Error: Missing template files:${NC}"
  for template in "${MISSING_TEMPLATES[@]}"; do
    echo "  - $template"
  done
  exit 1
fi

# Copy template scripts to actual locations
mkdir -p scripts/deploy
cp docs/templates/scripts/_deployment-helpers.sh.template scripts/deploy/_deployment-helpers.sh
cp docs/templates/scripts/deploy-preview.sh.template scripts/deploy/deploy-preview.sh
cp docs/templates/scripts/deploy-production.sh.template scripts/deploy/deploy-production.sh
cp docs/templates/scripts/verify-preview.sh.template scripts/deploy/verify-preview.sh
cp docs/templates/scripts/verify-production.sh.template scripts/deploy/verify-production.sh

# Make scripts executable
chmod +x scripts/deploy/*.sh

# Copy GitHub Actions workflow
mkdir -p .github/workflows
cp docs/templates/code/three-tier-pipeline.yml.template .github/workflows/three-tier-pipeline.yml

echo -e "${GREEN}✓ Deployment pipeline configured${NC}"

# ═══════════════════════════════════════════════════════════
# Step 5: Initialize Git Repository
# ═══════════════════════════════════════════════════════════

echo -e "${GREEN}[5/8] Initializing git repository...${NC}"
git init
git checkout -b main
git add .
git commit -m "Initial commit from MedicareMagic template

Project: $PROJECT_NAME
Template: MedicareMagic with three-tier deployment pipeline

Configuration:
- GitHub: $GITHUB_OWNER/$GITHUB_REPO
- Vercel: $VERCEL_PROJECT_NAME
- Production: https://$PRODUCTION_DOMAIN
- Preview: https://$VERCEL_PROJECT_NAME-git-preview-$VERCEL_TEAM.vercel.app"

# Create preview branch
git checkout -b preview
git checkout main

echo -e "${GREEN}✓ Git initialized with main and preview branches${NC}"

# ═══════════════════════════════════════════════════════════
# Step 6: Create Environment Template
# ═══════════════════════════════════════════════════════════

echo -e "${GREEN}[6/8] Creating environment template...${NC}"
cat > .env.local << 'EOF'
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_TEMPLATE_NAME=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (optional)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

# Linear (optional)
LINEAR_TOKEN=
LINEAR_TEAM_ID=
EOF

# ═══════════════════════════════════════════════════════════
# Step 7: Update package.json
# ═══════════════════════════════════════════════════════════

echo -e "${GREEN}[7/8] Updating package.json...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.name = '$PROJECT_NAME';
pkg.version = '0.1.0';
delete pkg.private;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# ═══════════════════════════════════════════════════════════
# Step 8: Create README
# ═══════════════════════════════════════════════════════════

echo -e "${GREEN}[8/8] Creating README.md...${NC}"
cat > README.md << EOF
# $PROJECT_NAME

A Next.js application initialized from the MedicareMagic template with three-tier deployment pipeline.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: Clerk
- **Database**: Supabase
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript (strict mode)
- **Deployment**: Vercel (three-tier pipeline)

## Deployment Pipeline

This project uses a three-tier deployment workflow:

\`\`\`
Local Development → Preview (Staging) → Production
\`\`\`

### Quick Deploy

\`\`\`bash
# Deploy to Preview
npm run deploy:preview

# Deploy to Production (after testing in Preview)
npm run deploy:production
\`\`\`

See \`docs/ops/THREE_TIER_DEPLOYMENT_PIPELINE.md\` for complete deployment guide.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Git
- GitHub CLI (\`gh\`)
- jq (JSON processor)

### Installation

\`\`\`bash
# Install dependencies
npm install

# Configure environment variables
# Edit .env.local with your credentials:
# - Clerk (authentication)
# - Supabase (database)
# - OpenAI (optional)

# Start development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Development

### Common Commands

\`\`\`bash
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run validate-production     # Run all checks (required before deploy)
npm run lint                    # Run ESLint
npm run format                  # Format with Prettier
npm run type-check              # TypeScript type checking
\`\`\`

### Deployment Commands

\`\`\`bash
npm run deploy:preview          # Deploy to Preview environment
npm run deploy:production       # Deploy to Production
npm run verify:preview          # Verify Preview health
npm run verify:production       # Verify Production health
\`\`\`

## Configuration

### Deployment Configuration

All deployment settings are in \`.deployment-config.json\`:

\`\`\`json
{
  "projectName": "$PROJECT_NAME",
  "vercel": {
    "previewUrl": "https://$VERCEL_PROJECT_NAME-git-preview-$VERCEL_TEAM.vercel.app",
    "productionUrl": "https://$PRODUCTION_DOMAIN"
  }
}
\`\`\`

### Environment Variables

Set up three environments in Vercel:

1. **Preview** (scope: Preview branches only)
2. **Production** (scope: Production branch only)
3. **Local** (in \`.env.local\`)

## Documentation

- \`CLAUDE.md\` - Development guidelines for Claude Code
- \`docs/ops/THREE_TIER_DEPLOYMENT_PIPELINE.md\` - Deployment guide
- \`docs/standards/\` - Development standards and patterns
- \`docs/templates/\` - Code and config templates

## Setup Checklist

- [ ] Configure \`.env.local\` with Clerk keys
- [ ] Configure \`.env.local\` with Supabase credentials
- [ ] Create Supabase Preview project (ref: $SUPABASE_PREVIEW_REF)
- [ ] Create Supabase Production project (ref: $SUPABASE_PRODUCTION_REF)
- [ ] Set up Vercel project
- [ ] Configure Vercel environment variables (Preview + Production)
- [ ] Set up GitHub repository
- [ ] Configure branch protection (run \`bash scripts/setup/configure-branch-protection.sh\`)
- [ ] Update \`CLAUDE.md\` with project-specific details

## Next Steps

1. **Set up authentication**:
   - Create Clerk application
   - Add Clerk keys to \`.env.local\`
   - Configure JWT template

2. **Set up database**:
   - Create Supabase projects (Preview + Production)
   - Add Supabase credentials to \`.env.local\`
   - Set up database schema

3. **Configure deployment**:
   - Create Vercel project
   - Link to GitHub repository
   - Set environment variables in Vercel dashboard
   - Configure branch protection in GitHub

4. **Test the pipeline**:
   - Make a change on a feature branch
   - Deploy to Preview: \`npm run deploy:preview\`
   - Test in Preview environment
   - Deploy to Production: \`npm run deploy:production\`

## Support

- Template documentation: \`docs/templates/README.md\`
- Three-tier pipeline: \`docs/ops/THREE_TIER_DEPLOYMENT_PIPELINE.md\`
- Original template: https://github.com/bradfeld/medicaremagic

## License

[Your License Here]
EOF

# ═══════════════════════════════════════════════════════════
# Completion
# ═══════════════════════════════════════════════════════════

echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Project Initialization Complete!  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}\n"

echo -e "${BLUE}Your new project is ready at:${NC}"
echo -e "  $NEW_PROJECT_DIR\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  ${GREEN}1.${NC} cd $NEW_PROJECT_DIR"
echo -e "  ${GREEN}2.${NC} Edit .env.local with your credentials"
echo -e "  ${GREEN}3.${NC} npm install"
echo -e "  ${GREEN}4.${NC} npm run dev\n"

echo -e "${YELLOW}Configuration files created:${NC}"
echo -e "  • .deployment-config.json (deployment settings)"
echo -e "  • .env.local (environment variables template)"
echo -e "  • scripts/deploy/* (deployment automation)"
echo -e "  • .github/workflows/three-tier-pipeline.yml (CI/CD)\n"

echo -e "${YELLOW}Don't forget to:${NC}"
echo -e "  • Set up Clerk authentication"
echo -e "  • Create Supabase projects (Preview + Production)"
echo -e "  • Create Vercel project and link to GitHub"
echo -e "  • Configure branch protection: ${GREEN}bash scripts/setup/configure-branch-protection.sh${NC}"
echo -e "  • Set up git remote: ${GREEN}git remote add origin https://github.com/$GITHUB_OWNER/$GITHUB_REPO${NC}\n"

echo -e "${GREEN}Happy coding! 🚀${NC}\n"
