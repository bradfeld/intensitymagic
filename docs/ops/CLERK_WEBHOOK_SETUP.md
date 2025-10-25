# Clerk Webhook Setup Guide

## Overview

This guide explains how to configure Clerk webhooks to automatically sync user data between Clerk and Supabase. The webhook system ensures that when users are deleted or updated in Clerk, the changes cascade to the Supabase database.

## What Gets Synced

Our webhook implementation handles these events:

- **`user.deleted`**: Automatically deletes the corresponding profile from Supabase when a user is deleted from Clerk
- **`user.updated`**: Syncs email address changes from Clerk to Supabase

## Setup Instructions

### 1. Get Your Webhook Signing Secret

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the left sidebar
4. Click **+ Add Endpoint**
5. Enter your endpoint URL:
   - **Development**: `https://medicaremagic-git-staging-bradfelds-projects.vercel.app/api/webhooks/clerk`
   - **Production**: `https://www.getmedicaremagic.com/api/webhooks/clerk`
6. Select the events to subscribe to:
   - ✅ `user.deleted`
   - ✅ `user.updated`
7. Click **Create**
8. Copy the **Signing Secret** (starts with `whsec_`)

### 2. Configure Environment Variables

#### For Vercel (Production):

1. Go to [Vercel Dashboard](https://vercel.com/bradfelds-projects/medicaremagic/settings/environment-variables)
2. Add a new environment variable:
   - **Key**: `CLERK_WEBHOOK_SECRET`
   - **Value**: `whsec_your_production_signing_secret`
   - **Environment**: ✅ Production, ✅ Preview

#### For Local Development:

Add to your `.env.local`:

```bash
CLERK_WEBHOOK_SECRET=whsec_your_development_signing_secret
```

### 3. Test the Webhook

#### Using Clerk Dashboard:

1. In Clerk Dashboard → Webhooks → Your Endpoint
2. Click on the **Testing** tab
3. Select `user.deleted` event
4. Click **Send Example**
5. Verify the response is `200 OK`

#### Manual Testing:

1. Create a test user in Clerk Dashboard
2. Check that a profile was created in Supabase
3. Delete the test user from Clerk
4. Verify the profile was deleted from Supabase

### 4. Monitor Webhook Events

#### In Clerk Dashboard:

- Go to Webhooks → Your Endpoint → **Logs**
- View recent deliveries and their status

#### In Vercel Logs:

1. Go to [Vercel Deployment Logs](https://vercel.com/bradfelds-projects/medicaremagic)
2. Click on the latest deployment
3. Go to **Functions** tab
4. Filter for `/api/webhooks/clerk`
5. Look for log entries like:
   ```
   [Clerk Webhook] Received event: user.deleted
   [Clerk Webhook] Successfully deleted profile for user: user_xxx
   ```

## Webhook Endpoint Implementation

The webhook endpoint is located at: `src/app/api/webhooks/clerk/route.ts`

### Security Features:

- **Signature Verification**: Uses Svix library to verify webhook authenticity
- **Service Role Access**: Uses Supabase service role key to bypass RLS policies
- **Error Handling**: Comprehensive error logging and graceful failure handling

### Event Handlers:

#### `user.deleted`

```typescript
// Deletes the profile from Supabase (CASCADE handles related records)
await supabase.from('profiles').delete().eq('clerk_user_id', userId)
```

#### `user.updated`

```typescript
// Syncs email address changes
await supabase
  .from('profiles')
  .update({ email: primaryEmail.email_address })
  .eq('clerk_user_id', userId)
```

## Troubleshooting

### Webhook Returns 400 (Bad Request)

**Problem**: Missing or invalid Svix headers

**Solution**:

- Verify the webhook URL is correct in Clerk Dashboard
- Ensure you're sending requests through Clerk (not manually)

### Webhook Returns 500 (Internal Server Error)

**Problem**: Database connection or permission issues

**Solution**:

- Check Vercel logs for detailed error messages
- Verify `SUPABASE_SERVICE_ROLE_KEY` is configured correctly
- Ensure the Supabase project is accessible

### Profile Not Deleted After User Deletion

**Problem**: Webhook not being triggered or failing silently

**Solution**:

- Check Clerk Dashboard → Webhooks → Logs for delivery status
- Verify the webhook endpoint URL is correct
- Check Vercel logs for errors
- Ensure `CLERK_WEBHOOK_SECRET` matches between Clerk and Vercel

### Signature Verification Failed

**Problem**: Webhook secret mismatch

**Solution**:

- Regenerate the signing secret in Clerk Dashboard
- Update `CLERK_WEBHOOK_SECRET` in Vercel
- Redeploy the application

## Webhook Retries

Clerk automatically retries failed webhooks:

- **Retry Strategy**: Exponential backoff
- **Max Attempts**: 3 retries
- **Timeout**: 25 seconds per attempt

If a webhook continues to fail after retries, check:

1. Vercel function logs for errors
2. Supabase connectivity
3. Database permissions

## Future Enhancements

Consider adding handlers for:

- `user.created`: Automatically create profile on user registration
- `session.created`: Track user login events
- `session.ended`: Track user logout events
- `organizationMembership.created`: Sync organization membership to Supabase

## Related Documentation

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)
- [Supabase RLS Policies](../db/rls-policy-consolidation.md)
- [Three-Tier Deployment Pipeline](THREE_TIER_DEPLOYMENT_PIPELINE.md)

---

**Last Updated**: October 11, 2025
