# Deployment Rollback Procedures

Quick reference for rolling back failed deployments.

## Quick Rollback

### Vercel Dashboard (Fastest)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Find the last working deployment
5. Click "..." → "Promote to Production"
6. Confirm rollback

**Time**: ~30 seconds

### Via Vercel CLI

```bash
# List recent deployments
vercel ls medicaremagic --prod

# Inspect deployment to get URL
vercel inspect <deployment-url>

# Promote to production
vercel promote <deployment-url> --scope=<team>
```

## Database Migration Rollback

If the deployment included database migrations:

### Supabase Migrations

```bash
# Check current migration version
# (View in Supabase dashboard → Database → Migrations)

# Option 1: Manual rollback via dashboard
# - Go to SQL Editor
# - Write reverse migration SQL
# - Execute

# Option 2: Use Supabase CLI
supabase db reset --project-ref <production-ref>
# WARNING: This resets to last migration, may lose data

# Option 3: Create down migration
# Create a new migration that reverses the changes
supabase migration new rollback_feature_name
# Write SQL to undo changes
supabase db push --project-ref <production-ref>
```

### Best Practice

Always create reversible migrations:

- Test rollback in Preview first
- Keep migrations small and focused
- Have rollback SQL ready before deploying

## Git Rollback

### Revert Last Commit

```bash
git checkout main
git revert HEAD
git push origin main
# Vercel auto-deploys the revert
```

### Revert to Specific Commit

```bash
git checkout main
git revert <commit-hash>
git push origin main
```

## Emergency Bypass

If you need to push directly to production in an emergency:

### Temporarily Disable Hook

```bash
# Option 1: Use --no-verify flag
git push origin main --no-verify

# Option 2: Temporarily disable hook
mv .husky/pre-push .husky/pre-push.disabled
git push origin main
mv .husky/pre-push.disabled .husky/pre-push
```

**⚠️ WARNING**: Only use in true emergencies. This bypasses all safety checks.

## Prevention Checklist

To avoid needing rollbacks:

- [ ] Always test in Preview first
- [ ] Run `npm run verify:preview` before promoting
- [ ] Check Vercel logs for errors
- [ ] Test database migrations in Preview
- [ ] Have rollback plan before deploying
- [ ] Monitor production for 15 minutes after deployment

## Recovery Procedures

### Site is Down

1. **Immediate**: Rollback via Vercel dashboard
2. **Investigate**: Check Vercel logs
3. **Fix**: Address issue in Preview
4. **Deploy**: Proper deployment workflow

### Partial Breakage

1. **Assess**: What's broken vs working?
2. **Mitigate**: Can feature be disabled via feature flag?
3. **Decision**: Rollback vs hotfix?
4. **Execute**: Follow appropriate procedure

### Data Corruption

1. **STOP**: Don't make it worse
2. **Assess**: What data is affected?
3. **Backup**: Take immediate snapshot if possible
4. **Restore**: From most recent backup
5. **Fix**: Address root cause
6. **Test**: In Preview before deploying fix

## Support Resources

- **Vercel Status**: https://www.vercel-status.com
- **Supabase Status**: https://status.supabase.com
- **Vercel Docs**: https://vercel.com/docs/deployments/rollbacks
- **Supabase Docs**: https://supabase.com/docs/guides/cli/managing-environments

## Contacts

[Add your team's emergency contacts here]

---

**Remember**: Prevention is better than rollback. Always test thoroughly in Preview.
