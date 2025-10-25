# src/app - Next.js 15 App Router

This directory uses Next.js 15 App Router exclusively. Never use Pages Router patterns.

## Core Principles

- **Prefer Server Components** - Only add `'use client'` when necessary
- **Server Actions over API routes** for form submissions
- **Parallel data fetching** with `Promise.all()`
- **Metadata API** on every page
- **Loading & Error states** for major routes

## Metadata API (MANDATORY)

Every `page.tsx` MUST export metadata:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title | MedicareMagic',
  description: 'Page description for SEO',
  openGraph: {
    title: 'Page Title',
    description: 'Page description',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Page Title',
    description: 'Page description',
  },
}

export default function Page() {
  // ...
}
```

**Why**: SEO, social media sharing, better UX.

## Loading & Error States

Add `loading.tsx` and `error.tsx` for major route segments:

### loading.tsx

```typescript
export default function Loading() {
  return (
    <div className="flex justify-center p-8">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}
```

### error.tsx

```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="p-8">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## Server vs Client Components

**Use Server Components (default)** unless you need:

- Hooks (`useState`, `useEffect`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `localStorage`, etc.)

```typescript
// ✅ Server Component (default)
export default function Page() {
  // Can fetch data directly
  const data = await getData()
  return <div>{data}</div>
}

// ✅ Client Component (when needed)
'use client'

export default function InteractiveComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## Data Fetching Patterns

### Parallel Fetching

**Always use `Promise.all()` for independent data**:

```typescript
// ✅ CORRECT - Parallel
export default async function Page() {
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ])

  return <div>...</div>
}

// ❌ WRONG - Sequential
export default async function Page() {
  const user = await getUser()
  const posts = await getPosts() // Waits for user
  const comments = await getComments() // Waits for posts
  return <div>...</div>
}
```

### Suspense Boundaries

For heavy components, use Suspense with fallback:

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<LoadingSkeleton />}>
        <HeavyComponent />
      </Suspense>
    </div>
  )
}
```

## Route Optimization

### Static Generation

For resource pages that don't change often:

```typescript
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function Page() {
  return <div>Static content</div>
}
```

### Edge Runtime

For simple API routes or pages:

```typescript
export const runtime = 'edge'

export default function Page() {
  return <div>Fast edge response</div>
}
```

## Images (MANDATORY)

**Always use `next/image`**, never `<img>`:

```typescript
import Image from 'next/image'

// ✅ CORRECT
<Image
  src="/hero.png"
  alt="Hero image"
  width={800}
  height={600}
  priority // For above-the-fold images
/>

// ❌ WRONG
<img src="/hero.png" alt="Hero image" />
```

**Why**: Automatic optimization, lazy loading, responsive sizing.

## Navigation

### Links

```typescript
import Link from 'next/link'

<Link href="/recommendations" prefetch={true}>
  View Recommendations
</Link>
```

**Prefetch**: Set to `true` for critical routes, `false` for less important.

### Programmatic Navigation

```typescript
'use client'

import { useRouter } from 'next/navigation'

export default function Component() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/dashboard')
    // router.refresh() // If needed
  }

  return <button onClick={handleClick}>Go to Dashboard</button>
}
```

## Middleware (Root Level)

`middleware.ts` handles:

- Authentication with Clerk
- Content Security Policy (CSP)
- Redirects

**DO NOT** modify middleware without understanding current auth flow. See `middleware.ts` for implementation.

## API Routes (app/api/)

### Structure

```
app/api/
├── health/
│   └── route.ts
├── medications/
│   └── route.ts
└── recommendations/
    └── route.ts
```

### Basic Pattern

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Business logic
    const data = await getData()

    return apiSuccess(data, 200, requestId)
  } catch (error) {
    logger.error('API error', {
      context: 'API:Endpoint',
      error: error as Error,
      requestId,
    })

    return apiError('Internal server error', 'INTERNAL_ERROR', 500, requestId)
  }
}
```

**Key points**:

- Use `apiSuccess()` and `apiError()` helpers
- Include request ID for tracing
- Log with enhanced logger
- Never hardcode localhost URLs - use `request.url` origin

See `docs/standards/API_STANDARDS.md` for complete patterns.

## Server Actions (Preferred for Forms)

Instead of API routes, use Server Actions:

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  try {
    // Validation
    const data = MySchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
    })

    // Database update
    const supabase = await SupabaseClients.authenticated()
    await supabase.from('profiles').update(data).eq('id', userId)

    // Revalidate cache
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    return { error: 'Failed to update profile' }
  }
}
```

**Why**: Simpler than API routes, automatic form handling, better type safety.

## Performance Optimization

### Font Loading

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Dynamic Imports

For heavy components:

```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // If component doesn't support SSR
})
```

### Caching & Revalidation

```typescript
import { revalidatePath, revalidateTag } from 'next/cache'

// Revalidate specific path
revalidatePath('/recommendations')

// Revalidate by tag
revalidateTag('user-profile')
```

## Common Pitfalls in app/

1. **Using `<img>` instead of `<Image>`** - Always use next/image
2. **Forgetting metadata** - Every page needs metadata export
3. **Sequential data fetching** - Use Promise.all() for parallel
4. **Adding 'use client' unnecessarily** - Prefer Server Components
5. **Missing loading/error states** - Add for better UX
6. **Hardcoded URLs in server code** - Use request.url origin

## Key Documentation

- Next.js 15 App Router docs: https://nextjs.org/docs/app
- `docs/standards/API_STANDARDS.md` - API patterns
- Root `middleware.ts` - Authentication and security
