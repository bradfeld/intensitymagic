---
description: Deploy code to Preview environment for staging testing
---

Deploy the current code to the Preview (staging) environment.

**Workflow:**

1. Verify you're on the `preview` or a `feature/*` branch
2. Check for uncommitted changes
3. Run `npm run validate-production` to ensure code quality
4. Push to remote (triggers Vercel deployment)
5. Wait 90 seconds for deployment to complete
6. Run automated health checks

**Command:**

```bash
npm run deploy:preview
```

**What gets deployed:**

- Current branch code
- Preview environment variables (from Vercel)
- Preview Supabase database (`byjniagtgbzdpmrfqzed`)
- Preview Clerk instance

**After deployment:**

- Preview URL: Check `.deployment-config.json` for your project's Preview URL
- Verify with: `npm run verify:preview`
- Test thoroughly before deploying to Production

**See also:**

- Full guide: `docs/ops/THREE_TIER_DEPLOYMENT_PIPELINE.md`
- Deploy to Production: `/deploy-production`
