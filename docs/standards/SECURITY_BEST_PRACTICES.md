# Security Best Practices

Comprehensive security guidelines for Next.js applications with Clerk, Supabase, and Vercel.

---

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Database Security](#database-security)
3. [API Security](#api-security)
4. [Secret Management](#secret-management)
5. [Input Validation and Sanitization](#input-validation-and-sanitization)
6. [XSS and CSRF Prevention](#xss-and-csrf-prevention)
7. [Content Security Policy](#content-security-policy)
8. [Security Headers](#security-headers)
9. [Audit Logging](#audit-logging)

---

## Authentication Security

### Clerk Configuration

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware((auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    auth().protect()
  }

  // Additional protection for admin routes
  if (isAdminRoute(req)) {
    const { sessionClaims } = auth()

    if (!sessionClaims?.metadata?.role?.includes('admin')) {
      return Response.redirect(new URL('/unauthorized', req.url))
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### Session Management

```typescript
// lib/auth/session.ts
import { auth } from '@clerk/nextjs/server'

export async function requireAuth() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

export async function requireRole(role: string) {
  const { sessionClaims } = await auth()

  const userRoles = sessionClaims?.metadata?.roles || []

  if (!userRoles.includes(role)) {
    throw new Error('Insufficient permissions')
  }

  return sessionClaims
}

// Usage in API routes
export async function POST(request: Request) {
  const userId = await requireAuth()

  // Proceed with authenticated user
}

export async function DELETE(request: Request) {
  await requireRole('admin')

  // Admin-only operation
}
```

### JWT Security

```typescript
// Verify JWT template configuration in Clerk Dashboard
// Required claims:
// - sub: {{user.id}}
// - email: {{user.primary_email_address}}
// - metadata: {{user.public_metadata}}

// Supabase JWT verification
// lib/auth/jwt.ts
import { auth } from '@clerk/nextjs/server'

export async function getSupabaseToken() {
  const { getToken } = await auth()
  const token = await getToken({ template: 'supabase' })

  if (!token) {
    throw new Error('Failed to get Supabase token')
  }

  return token
}

// Verify token expiration
export async function isTokenValid() {
  const { sessionClaims } = await auth()

  if (!sessionClaims?.exp) {
    return false
  }

  const expiryTime = sessionClaims.exp * 1000
  return Date.now() < expiryTime
}
```

### Password Requirements

```typescript
// Enforce strong passwords (configure in Clerk Dashboard)
// Settings → User & Authentication → Password

// Minimum: 8 characters
// Required: Uppercase, lowercase, number, special character
// Prevent: Common passwords, dictionary words

// Custom validation (additional layer)
import { z } from 'zod'

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
  .refine(
    password => {
      const commonPasswords = ['password', '12345678', 'qwerty', 'admin']
      return !commonPasswords.includes(password.toLowerCase())
    },
    { message: 'Password is too common' }
  )
```

---

## Database Security

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent users from deleting their profile
CREATE POLICY "Users cannot delete profile"
  ON profiles FOR DELETE
  USING (false);

-- Tasks with ownership
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Shared access pattern
CREATE POLICY "Users can view shared documents"
  ON documents FOR SELECT
  USING (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT user_id FROM document_shares
      WHERE document_id = documents.id
    )
  );

-- Admin override (use sparingly)
CREATE POLICY "Admins can view all"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    (SELECT (auth.jwt() ->> 'role')::text = 'admin')
  );
```

### SQL Injection Prevention

```typescript
// ✅ GOOD - Parameterized queries (Supabase handles this)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userInput)  // Safe - parameterized

// ❌ BAD - Never build raw SQL from user input
const { data } = await supabase.rpc('execute_sql', {
  query: `SELECT * FROM users WHERE email = '${userInput}'`
})

// ✅ GOOD - Use stored procedures with parameters
-- Create function
CREATE FUNCTION search_users(search_term text)
RETURNS SETOF users AS $$
  SELECT * FROM users
  WHERE name ILIKE '%' || search_term || '%'
  LIMIT 10;
$$ LANGUAGE sql STABLE;

// Call safely
const { data } = await supabase.rpc('search_users', {
  search_term: userInput
})

// ✅ GOOD - Validate and sanitize input
import { z } from 'zod'

const EmailSchema = z.string().email()

export async function searchByEmail(input: string) {
  const email = EmailSchema.parse(input)  // Throws if invalid

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)

  return data
}
```

### Prevent Data Leakage

```typescript
// ❌ BAD - Exposes sensitive data
export async function getUser(id: string) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  return data // Includes password_hash, ssn, etc.
}

// ✅ GOOD - Select only safe fields
export async function getUser(id: string) {
  const { data } = await supabase
    .from('users')
    .select('id, email, name, avatar_url, created_at')
    .eq('id', id)
    .single()

  return data
}

// ✅ GOOD - Use type-safe response
interface PublicUser {
  id: string
  email: string
  name: string
  avatar_url: string
  created_at: string
}

export async function getUser(id: string): Promise<PublicUser | null> {
  const { data } = await supabase
    .from('users')
    .select('id, email, name, avatar_url, created_at')
    .eq('id', id)
    .single()

  return data
}

// ✅ GOOD - Strip sensitive fields
function sanitizeUser(user: DatabaseUser): PublicUser {
  const { password_hash, ssn, api_key, ...publicData } = user
  return publicData
}
```

### Database Audit Logs

```sql
-- Create audit log table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create audit trigger
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

---

## API Security

### Rate Limiting

```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// Create rate limiter
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

  return {
    success,
    limit,
    remaining,
    reset: new Date(reset),
  }
}

// Usage in API route
export async function POST(request: Request) {
  const userId = await requireAuth()

  const result = await checkRateLimit(`api:create:${userId}`)

  if (!result.success) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      { status: 429 }
    )
  }

  // Proceed with request
}
```

### CORS Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Allow specific origins
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://trusted-partner.com',
  ]

  const origin = request.headers.get('origin')

  const response = NextResponse.next()

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

// Or configure in next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}
```

### Request Validation

```typescript
// Validate all API inputs
import { z } from 'zod'

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  const requestId = logger.generateRequestId()

  try {
    const body = await request.json()

    // Validate request body
    const result = CreateTaskSchema.safeParse(body)

    if (!result.success) {
      logger.warn('Invalid request body', {
        context: 'API:Tasks:POST',
        requestId,
        errors: result.error.errors,
      })

      return ApiErrors.validation(
        result.error.errors.reduce(
          (acc, err) => {
            acc[err.path.join('.')] = err.message
            return acc
          },
          {} as Record<string, string>
        ),
        requestId
      )
    }

    const validatedData = result.data

    // Proceed with validated data
  } catch (error) {
    // Handle errors
  }
}
```

### API Authentication

```typescript
// Verify authentication on all protected endpoints
export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    // User is authenticated, proceed
  } catch (error) {
    return ApiErrors.unauthorized()
  }
}

// Or use middleware
// middleware.ts
export function middleware(request: NextRequest) {
  const publicPaths = ['/api/health', '/api/public']

  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // All other API routes require authentication
  const { userId } = auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}
```

---

## Secret Management

### Environment Variables

```bash
# .env.local (NEVER commit)
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# External APIs
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...

# .env.example (commit this)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_key_here
# ... (show keys needed, not values)
```

### Secret Rotation

```typescript
// lib/config/secrets.ts
// Graceful secret rotation

export function getApiKey() {
  const current = process.env.API_KEY
  const previous = process.env.API_KEY_PREVIOUS

  return { current, previous }
}

export async function makeAuthenticatedRequest(url: string) {
  const { current, previous } = getApiKey()

  // Try with current key
  try {
    return await fetch(url, {
      headers: { Authorization: `Bearer ${current}` },
    })
  } catch (error) {
    // Fall back to previous key during rotation
    if (previous) {
      logger.warn('API key rotation in progress, using previous key', {
        context: 'Security:Secrets',
      })

      return await fetch(url, {
        headers: { Authorization: `Bearer ${previous}` },
      })
    }

    throw error
  }
}
```

### Vercel Environment Variables

```bash
# Set secrets in Vercel
vercel env add CLERK_SECRET_KEY production
vercel env add CLERK_SECRET_KEY preview
vercel env add CLERK_SECRET_KEY development

# Pull environment variables locally
vercel env pull .env.local

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME production
```

---

## Input Validation and Sanitization

### Server-Side Validation

```typescript
// NEVER trust client input - always validate on server

import { z } from 'zod'

// Define strict schemas
const UserInputSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  website: z.string().url().optional(),
  bio: z.string().max(500),
})

export async function POST(request: Request) {
  const body = await request.json()

  // Parse and validate
  const result = UserInputSchema.safeParse(body)

  if (!result.success) {
    return ApiErrors.validation(/* ... */)
  }

  // Use validated data
  const safeData = result.data
}
```

### HTML Sanitization

```typescript
// Install DOMPurify for sanitization
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

// Usage
export async function createPost(content: string) {
  const sanitized = sanitizeHtml(content)

  await supabase.from('posts').insert({ content: sanitized })
}
```

### File Upload Security

```typescript
// app/api/upload/route.ts
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const userId = await requireAuth()

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return ApiErrors.validation({ file: 'File is required' })
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return ApiErrors.validation({ file: 'Invalid file type' })
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return ApiErrors.validation({ file: 'File too large' })
  }

  // Generate safe filename
  const ext = file.name.split('.').pop()
  const safeFilename = `${userId}-${Date.now()}.${ext}`

  // Upload to secure storage
  // ...
}
```

---

## XSS and CSRF Prevention

### XSS Prevention

```typescript
// React automatically escapes content
export function UserComment({ comment }: { comment: string }) {
  return <p>{comment}</p>  // Safe - React escapes
}

// ❌ DANGEROUS - Bypasses escaping
export function UnsafeComment({ comment }: { comment: string }) {
  return <p dangerouslySetInnerHTML={{ __html: comment }} />
}

// ✅ SAFE - Sanitize first
export function SafeComment({ comment }: { comment: string }) {
  const sanitized = DOMPurify.sanitize(comment)
  return <p dangerouslySetInnerHTML={{ __html: sanitized }} />
}

// For user-generated links
export function SafeLink({ href, children }: { href: string; children: React.ReactNode }) {
  // Prevent javascript: URLs
  const safeHref = href.startsWith('javascript:') ? '#' : href

  return (
    <a
      href={safeHref}
      rel="noopener noreferrer"  // Security headers
      target="_blank"
    >
      {children}
    </a>
  )
}
```

### CSRF Protection

```typescript
// Clerk handles CSRF automatically with session tokens
// Additional CSRF token for sensitive operations

// lib/security/csrf.ts
import { randomBytes } from 'crypto'

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

export function verifyCSRFToken(token: string, expected: string): boolean {
  return token === expected
}

// Store in session
export async function POST(request: Request) {
  const { sessionClaims } = await auth()
  const csrfToken = sessionClaims?.csrfToken

  const body = await request.json()
  const providedToken = body.csrfToken

  if (!verifyCSRFToken(providedToken, csrfToken)) {
    return Response.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  // Proceed with operation
}
```

---

## Content Security Policy

### CSP Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.vercel-insights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://clerk.com",
    "frame-src 'self' https://clerk.com",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  return response
}
```

---

## Security Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

---

## Audit Logging

```typescript
// lib/security/audit.ts
export async function logSecurityEvent(
  event: string,
  details: Record<string, unknown>
) {
  const { userId, sessionId } = await auth()

  await supabase.from('security_logs').insert({
    event,
    user_id: userId,
    session_id: sessionId,
    details,
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
    created_at: new Date().toISOString(),
  })
}

// Usage
export async function POST(request: Request) {
  await logSecurityEvent('sensitive_operation', {
    operation: 'delete_account',
    resource_id: accountId,
  })
}
```

---

_See also: [DATABASE_PATTERNS.md](./DATABASE_PATTERNS.md), [API_STANDARDS.md](./API_STANDARDS.md)_
