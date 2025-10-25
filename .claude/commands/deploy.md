Execute the complete deployment workflow for Production.

**IMPORTANT:** This slash command is deprecated. Use the three-tier deployment pipeline instead:

- `/deploy-preview` - Deploy to Preview (staging) environment
- `/deploy-production` - Deploy to Production

**Three-Tier Workflow:**

```
Local Development → Preview → Production
```

**Recommended workflow:**

1. Test locally: `npm run dev`
2. Deploy to Preview: `/deploy-preview`
3. Test in Preview environment
4. Deploy to Production: `/deploy-production`

**See also:**

- Full guide: `docs/ops/THREE_TIER_DEPLOYMENT_PIPELINE.md`
- Deployment config: `.deployment-config.json`

**Why this changed:**

The old workflow pushed directly to `main` branch, bypassing staging. The new three-tier pipeline ensures all changes are tested in Preview before reaching Production.

**For emergency direct deployment:**

If you must bypass Preview (not recommended):

```bash
# Validate first
npm run validate-production

# Push to main (triggers Vercel)
git push origin main

# Wait and verify
sleep 90
npm run verify:production
```

**Safety checks:**

- Never deploy if localhost has errors
- Never deploy without user confirmation
- Always test in Preview first
