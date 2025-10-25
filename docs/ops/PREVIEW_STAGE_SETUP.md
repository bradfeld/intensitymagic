# 🚀 **Preview Stage Setup Guide - MED-229**

**Complete implementation guide for three-tier deployment pipeline**

_Created: September 28, 2025_

---

## 📋 **Overview**

This guide implements a robust preview stage between development and production:

```
🖥️  Development (localhost:3000) → Docker Supabase
🔄  Preview (staging.medicaremagic.vercel.app) → Dedicated Preview Supabase
🚀  Production (medicaremagic.vercel.app) → Dedicated Production Supabase
```

## 🏗️ **PHASE 1: INFRASTRUCTURE SETUP**

### **✅ Step 1: Branch Configuration (COMPLETED)**

```bash
# Staging branch created from main
git checkout -b staging
git push -u origin staging
```

### **📋 Step 2: GitHub Branch Protection**

**Configure in GitHub Repository → Settings → Branches:**

#### **Protect `main` branch:**

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging:
  - ✅ Vercel deployment check
  - ✅ CI quality checks
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict pushes that create files larger than 100MB

#### **Protect `staging` branch:**

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Allow force pushes (for emergency fixes)

### **📋 Step 3: Vercel Project Configuration**

**Vercel Dashboard → MedicareMagic Project → Settings:**

#### **Git Settings:**

- **Production Branch**: `main`
- **Preview Deployments**: Enable for all branches
- **Automatic Deployments**: Enable
- **Deploy Hooks**: None needed (GitHub integration handles this)

#### **Domains (to be configured):**

- **Production**: `medicaremagic.vercel.app` (existing)
- **Preview**: `staging-medicaremagic.vercel.app` (new - add as alias)

## 🗄️ **PHASE 2: DATABASE SETUP**

### **📋 Step 1: Create Preview Supabase Project**

**Manual Steps Required:**

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Create New Project**:
   - Name: `MedicareMagic Preview`
   - Organization: Same as production
   - Database Password: Generate secure password
   - Region: Same as production for consistency
3. **Note Project Details**:
   - Project URL: `https://xxx-preview.supabase.co`
   - Anon Key: `eyJhbGciOi...` (preview-specific)
   - Service Role Key: `eyJhbGciOi...` (preview-specific)

### **📋 Step 2: Database Schema Migration**

**Export Production Schema:**

```bash
# Export current production schema
supabase db dump --db-url="$PRODUCTION_SUPABASE_URL" > preview_schema.sql

# Apply to preview database
supabase db reset --db-url="$PREVIEW_SUPABASE_URL"
psql "$PREVIEW_SUPABASE_URL" < preview_schema.sql
```

**Alternative: Manual Schema Copy:**

1. **Production Database**: Export schema via Supabase Studio
2. **Preview Database**: Import schema via Supabase Studio
3. **Verify Tables**: Ensure all tables, RLS policies, and functions copied

### **📋 Step 3: Preview Test Data Setup**

**Create Preview-Specific Test Data:**

```sql
-- Insert test users for preview environment
INSERT INTO profiles (clerk_user_id, first_name, last_name, email) VALUES
('preview_user_1', 'Test', 'User', 'test@preview.com'),
('preview_user_2', 'Demo', 'Account', 'demo@preview.com');

-- Insert test Medicare plans for demonstration
INSERT INTO medicare_plans (plan_id, plan_name, premium, deductible) VALUES
('PREVIEW001', 'Preview Test Plan A', 125.00, 500.00),
('PREVIEW002', 'Preview Test Plan B', 95.00, 750.00);
```

## ⚙️ **PHASE 3: VERCEL ENVIRONMENT CONFIGURATION**

### **📋 Step 1: Environment Variables Setup**

**Vercel Dashboard → Settings → Environment Variables:**

#### **Preview Environment Variables:**

```bash
# Database (Preview Supabase Project)
NEXT_PUBLIC_SUPABASE_URL=https://xxx-preview.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...(preview-specific)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...(preview-specific)

# Environment Stage
ENVIRONMENT_STAGE=preview
NEXT_PUBLIC_APP_URL=https://staging-medicaremagic.vercel.app

# Authentication (can share with production or use separate)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...(same as production)
CLERK_SECRET_KEY=sk_live_...(same as production)

# APIs (same as production for realistic testing)
OPENAI_API_KEY=sk-...(same as production)
MARKETPLACE_API_KEY=...(same as production)
PPL_API_KEY=...(same as production)

# Feature Flags (enable testing features)
ENABLE_TEST_MODE=1
COSTS_USE_REAL=1
USE_REAL_FORMULARY=1
```

#### **Production Environment Variables (unchanged):**

```bash
# Database (Production Supabase Project)
NEXT_PUBLIC_SUPABASE_URL=https://xxx-prod.supabase.co
ENVIRONMENT_STAGE=production
NEXT_PUBLIC_APP_URL=https://medicaremagic.vercel.app
# ... (all other production variables)
```

### **📋 Step 2: Vercel Configuration Validation**

**Test Vercel Configuration:**

```bash
# Validate vercel.json syntax
npx vercel --help

# Test deployment protection (will be active after first staging deploy)
# Production deployments will require approval
# Preview deployments will be password-protected
```

## 🔄 **PHASE 4: WORKFLOW IMPLEMENTATION**

### **📋 Updated Development Process**

#### **Stage 1: Feature Development**

```bash
# 1. Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/med-xxx-feature-name

# 2. Local development (unchanged)
npm run dev  # localhost:3000 with Docker Supabase
npm run build  # MANDATORY validation

# 3. Push feature branch
git push origin feature/med-xxx-feature-name
```

→ **Automatic PR preview URL** (e.g., `medicaremagic-pr-123.vercel.app`)

#### **Stage 2: Preview Testing**

```bash
# 4. Create PR: feature/med-xxx → staging
# 5. Review code + test PR preview URL
# 6. Merge PR to staging branch
```

→ **Staging deployment** (`staging-medicaremagic.vercel.app`) with preview database

#### **Stage 3: Production Deployment**

```bash
# 7. Create PR: staging → main
# 8. Review + test staging environment
# 9. Merge to main (triggers Vercel deployment protection)
```

→ **Approval gate** → **Production deployment** with production database

### **📋 Updated Permission Protocol**

**Three-Stage Approval Process:**

1. **Feature Permission**: "Can I implement this feature?" (unchanged)
2. **Preview Permission**: "This works locally, can I deploy to preview for testing?"
3. **Production Permission**: "Preview testing complete, can I deploy to production?"

## 🧪 **PHASE 5: TESTING & VALIDATION**

### **📋 Test Checklist**

#### **Preview Environment Testing:**

- [ ] Staging branch deploys to preview URL
- [ ] Preview database connectivity working
- [ ] Authentication flows work with preview
- [ ] API integrations function correctly
- [ ] Password protection active on preview URL
- [ ] Test data visible and functional

#### **Production Deployment Testing:**

- [ ] Deployment protection requires approval
- [ ] Main branch deploys to production URL
- [ ] Production database connectivity working
- [ ] No preview test data in production
- [ ] All functionality works as expected

### **📋 Rollback Procedures**

#### **Preview Rollback:**

```bash
# Revert staging branch
git checkout staging
git revert HEAD
git push origin staging
```

#### **Production Rollback:**

```bash
# Option 1: Git revert
git checkout main
git revert HEAD
git push origin main

# Option 2: Vercel dashboard instant rollback
# Go to Vercel Dashboard → Deployments → Previous deployment → Promote
```

## 📚 **DOCUMENTATION UPDATES**

### **Files to Update:**

- [ ] `.cursorrules` - New three-tier workflow
- [ ] `docs/UNIFIED_DEVELOPMENT_STANDARDS.md` - Updated deployment section
- [ ] `README.md` - New development workflow
- [ ] `docs/ENVIRONMENT_SETUP.md` - Three-tier database architecture

### **Key Documentation Changes:**

- Update localhost-first deployment workflow
- Add preview testing requirements
- Document database isolation strategy
- Update permission protocol

---

## 🎯 **SUCCESS CRITERIA**

### **Technical Validation:**

- [ ] Feature → staging → main workflow works smoothly
- [ ] Preview environment completely isolated from production
- [ ] Deployment protection prevents accidental production deploys
- [ ] Rollback procedures tested and documented

### **Process Validation:**

- [ ] Stakeholders can test features on preview before production
- [ ] No production surprises or deployment failures
- [ ] Documentation clearly explains new three-tier process
- [ ] Team comfortable with new workflow

### **Quality Improvements:**

- [ ] Reduced production deployment risk
- [ ] Better stakeholder validation process
- [ ] Improved confidence in production releases
- [ ] Faster iteration on complex features

---

## 🚨 **NEXT STEPS**

**Immediate Actions Required:**

1. **Create Preview Supabase Project** (manual step)
2. **Configure Vercel environment variables** for preview
3. **Set up GitHub branch protection** rules
4. **Test staging branch deployment** to preview URL
5. **Update workflow documentation**

**This implementation provides a robust, scalable preview stage that enhances deployment safety and enables comprehensive pre-production validation using dedicated database isolation.**

---

_This guide serves as the reference implementation for future projects requiring preview stage setup._
