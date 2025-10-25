---
description: Deploy code to Production (live environment)
---

Deploy the current Preview code to Production.

**IMPORTANT:** This affects live users. Only deploy after thorough testing in Preview.

**Workflow:**

1. Verify you're on the `preview` branch
2. Check Preview environment is healthy
3. Show pre-deployment checklist
4. Require explicit confirmation
5. Pull latest from preview
6. Run `npm run validate-production`
7. Create PR from `preview` → `main`

**Then manually:**

1. Review PR on GitHub
2. Wait for CI checks to pass
3. Approve PR (1 approval required)
4. Merge PR
5. Wait 60-90 seconds for Vercel deployment
6. Run `npm run verify:production`

**Command:**

```bash
npm run deploy:production
```

**Pre-deployment checklist:**

- ✅ Preview thoroughly tested
- ✅ User testing complete
- ✅ No critical bugs in logs
- ✅ Database migrations tested in Preview
- ✅ Performance acceptable

**Protection mechanisms:**

- Must be on `preview` branch
- Preview health check must pass
- Requires explicit "yes" confirmation
- GitHub PR approval required
- CI/CD quality gates must pass

**After deployment:**

- Production URL: Check `.deployment-config.json` for your project's Production URL
- Verify with: `npm run verify:production`
- Monitor logs for 15 minutes
- Check error rates in Vercel dashboard

**See also:**

- Full guide: `docs/ops/THREE_TIER_DEPLOYMENT_PIPELINE.md`
- Deploy to Preview: `/deploy-preview`
