# Secrets Hardening and Rotation Checklist (MED-116)

This document outlines the steps and verification checklist for removing committed secrets, rotating credentials, and ensuring environment-only configuration.

## Objectives

- Remove any committed credentials from the repository (scripts, docs, examples)
- Rotate affected keys (Supabase anon + service role, Clerk secret, OpenAI key)
- Ensure Vercel and local environments consume secrets from env only

## Actions

1. Scripts
   - Updated `scripts/setup-vercel-env.sh` to read values from environment variables (no embedded secrets)
   - Adjusted `scripts/setup-clerk.sh` guidance to avoid realistic-looking placeholders

2. Rotation
   - Supabase: Rotate `anon` and `service_role` keys in Supabase dashboard; update Vercel env and `.env.local`
   - Clerk: Rotate `CLERK_SECRET_KEY`; update Vercel env and `.env.local`
   - OpenAI: Rotate `OPENAI_API_KEY`; update Vercel env and `.env.local`

3. Configuration
   - Ensure `env-template.txt` contains non-sensitive placeholders only
   - Use `scripts/setup-vercel-env.sh` to set secrets in Vercel by reading current shell env

## Verification

- Repo search: no high-entropy keys present (`sk_`, JWT-like patterns)
- Local: `npm run validate-production` passes
- Local: `npm run dev` works with `.env.local` only
- Vercel: `vercel env ls` shows updated values after running setup script

## Notes

- Never commit real credentials to git (including internal docs). Prefer short masked samples or placeholders.
- If emergency rotation is required, coordinate downtime windows and cache invalidations as needed.
