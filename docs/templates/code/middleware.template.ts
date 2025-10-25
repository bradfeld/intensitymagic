/**
 * Next.js Middleware Template with Clerk Authentication
 * ============================================================================
 * This middleware handles:
 * 1. Authentication with Clerk
 * 2. Admin route protection via organization membership
 * 3. Content Security Policy (CSP) headers
 * 4. Route redirects
 *
 * File location: src/middleware.ts (Next.js 13+ App Router)
 *
 * Prerequisites:
 * - npm install @clerk/nextjs
 * - Configure Clerk in .env.local
 * - Set NEXT_PUBLIC_ADMIN_ORG_SLUG environment variable
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================================
// Route Matchers
// ============================================================================

// Define protected admin routes
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// Define public routes (no authentication required)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/system/health',
])

// ============================================================================
// Main Middleware Handler
// ============================================================================

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // ==========================================================================
  // Route Redirects
  // ==========================================================================

  // Example: Redirect old routes to new ones
  if (req.nextUrl.pathname.startsWith('/old-route')) {
    return NextResponse.redirect(new URL('/new-route', req.url), 301)
  }

  // ==========================================================================
  // Admin Route Protection
  // ==========================================================================

  if (isAdminRoute(req)) {
    const authData = await auth()

    // Get admin org slug from environment
    const adminOrgSlug =
      process.env.NEXT_PUBLIC_ADMIN_ORG_SLUG || '{{your-admin-org-slug}}'

    // Check if user is in admin organization
    const isAdminOrgMember =
      authData.orgSlug === adminOrgSlug &&
      (authData.orgRole === 'org:admin' || authData.orgRole === 'org:member')

    // Optional: Support legacy admin role from metadata
    const isLegacyAdmin = authData.sessionClaims?.metadata?.role === 'admin'

    // Allow access if user is admin org member OR legacy admin
    if (!isAdminOrgMember && !isLegacyAdmin) {
      const url = new URL('/', req.url)
      return NextResponse.redirect(url)
    }
  }

  // ==========================================================================
  // Authentication Check for Protected Routes
  // ==========================================================================

  if (!isPublicRoute(req)) {
    const authData = await auth()

    if (!authData.userId) {
      // Redirect to sign-in page
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  // ==========================================================================
  // Security Headers
  // ==========================================================================

  const res = NextResponse.next()

  // Apply Content Security Policy
  const csp = buildCSP(req)
  res.headers.set('Content-Security-Policy', csp.enforced.join('; '))

  // Only add Report-Only CSP in production for testing stricter policies
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Content-Security-Policy-Report-Only',
      csp.reportOnly.join('; ')
    )
  }

  // Other security headers are typically set in next.config.ts
  // to avoid duplication between middleware and config

  return res
})

// ============================================================================
// Content Security Policy Builder
// ============================================================================

function buildCSP(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'
  const hostname = req.nextUrl.hostname

  // Generate nonce for scripts in production
  const nonce = isProd ? generateNonce() : ''

  // Clerk domains
  const clerkDomain =
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || 'clerk.{{your-domain}}.com'

  // Base CSP (permissive for development, strict for production)
  const enforced = [
    "default-src 'self'",

    // Scripts: Allow self, Clerk, and inline (adjust for production)
    isProd
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.clerk.dev https://*.clerk.com https://vercel.live`
      : `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.dev https://*.clerk.com https://vercel.live`,

    // Styles: Allow self, inline (required for Clerk UI)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Images: Allow self, data URIs, Clerk CDN
    "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev",

    // Fonts: Allow self and Google Fonts
    "font-src 'self' https://fonts.gstatic.com data:",

    // Connect: API endpoints
    `connect-src 'self' https://*.clerk.dev https://*.clerk.com https://*.supabase.co https://api.openai.com https://vercel.live`,

    // Frames: Clerk authentication flows
    `frame-src https://*.clerk.dev https://*.clerk.com`,

    // Workers
    "worker-src 'self' blob:",

    // Other CSP directives
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  // Stricter Report-Only policy for production monitoring
  const reportOnly = isProd
    ? [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' https:",
        "frame-src 'none'",
        "worker-src 'self' blob:",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ]
    : enforced

  // Attach nonce to response headers if in production
  if (isProd && nonce) {
    // Next.js will use this nonce for inline scripts
    // Note: You need to pass this nonce to your components
  }

  return { enforced, reportOnly }
}

// ============================================================================
// Nonce Generator
// ============================================================================

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // Convert to base64
  let base64: string

  // Use btoa if available (Edge runtime)
  if (typeof globalThis.btoa === 'function') {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i] as number)
    }
    base64 = globalThis.btoa(binary)
  } else {
    // Fallback to hex (Node.js)
    base64 = Array.from(bytes)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  return base64
}

// ============================================================================
// Middleware Configuration
// ============================================================================

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

/**
 * USAGE NOTES:
 *
 * 1. Environment Variables:
 *    - NEXT_PUBLIC_ADMIN_ORG_SLUG: Clerk organization slug for admin access
 *    - NEXT_PUBLIC_CLERK_FRONTEND_API: Custom Clerk domain (optional)
 *
 * 2. Admin Route Protection:
 *    - Users must be members of the admin organization
 *    - Configure organization in Clerk Dashboard
 *    - Invite admin users to the organization
 *
 * 3. CSP Headers:
 *    - Adjust CSP directives based on your external dependencies
 *    - Test thoroughly to avoid breaking functionality
 *    - Use Report-Only mode first to monitor violations
 *
 * 4. Additional Security:
 *    - Add rate limiting for API routes (consider Upstash Rate Limit)
 *    - Implement CORS headers for API routes if needed
 *    - Consider adding request logging/monitoring
 *
 * 5. Testing:
 *    - Test admin routes with and without org membership
 *    - Verify redirects work correctly
 *    - Check CSP headers don't block legitimate content
 */
