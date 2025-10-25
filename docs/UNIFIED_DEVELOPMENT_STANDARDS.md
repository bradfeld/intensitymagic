# Unified Development Standards - Quick Reference

This document provides a quick reference to MedicareMagic's development patterns. For comprehensive guides, see the linked standard files in `docs/standards/`.

**Last Updated**: 2025-10-19

## Table of Contents

1. [Validation System](#validation-system)
2. [Supabase Client Factory](#supabase-client-factory)
3. [API Response Standardization](#api-response-standardization)
4. [Profile Type System](#profile-type-system)
5. [Enhanced Logging](#enhanced-logging)
6. [TypeScript Strict Mode](#typescript-strict-mode)
7. [Security Best Practices](#security-best-practices)
8. [Testing Strategy](#testing-strategy)

---

## Validation System

**Pattern**: Centralized validation with Zod schemas and custom hooks.

**Quick Example**:

```typescript
import { useValidatedForm } from '@/lib/validation/useValidatedForm'
import { MySchema } from '@/lib/validation/schemas/my-schema'
import { ValidatedInput } from '@/lib/validation/components/ValidatedInput'

const { values, errors, touched, handleSubmit } = useValidatedForm({
  schema: MySchema,
  initialValues: defaultValues,
  onSubmit: handleFormSubmit,
})

return (
  <ValidatedInput
    name="email"
    value={values.email}
    error={errors.email}
    touched={touched.email}
  />
)
```

**Components**:

- `useValidatedForm` - Form state management
- `ValidatedInput`, `ValidatedSelect`, `ValidatedCheckbox` - Form components
- Zod schemas in `lib/validation/schemas/`

**Full Guide**: See [`docs/standards/VALIDATION_PATTERNS.md`](standards/VALIDATION_PATTERNS.md) and [`src/lib/CLAUDE.md`](../src/lib/CLAUDE.md)

---

## Supabase Client Factory

**Pattern**: Always use `SupabaseClients` factory, never `createClient()` directly.

**Quick Example**:

```typescript
import { SupabaseClients } from '@/lib/supabase/factory'

// User operations (respects RLS)
const supabase = await SupabaseClients.authenticated()

// Admin operations (bypasses RLS)
const supabase = SupabaseClients.admin()

// Public data
const supabase = await SupabaseClients.public()

// Client-side
const supabase = SupabaseClients.browser()
```

**Decision Tree**:

- Default: `authenticated()` for user operations
- Admin: `admin()` only for webhooks/system operations
- Public: `public()` for non-authenticated access
- Client: `browser()` for client components

**Full Guide**: See [`docs/standards/DATABASE_PATTERNS.md`](standards/DATABASE_PATTERNS.md) and [`src/lib/CLAUDE.md`](../src/lib/CLAUDE.md)

---

## API Response Standardization

**Pattern**: Use `apiSuccess()` and `apiError()` helpers for all API routes.

**Quick Example**:

```typescript
import { apiSuccess, apiError } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
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

**Always Include**:

- Request ID for tracing
- Proper status codes
- Error logging with context

**Full Guide**: See [`docs/standards/API_STANDARDS.md`](standards/API_STANDARDS.md)

---

## Profile Type System

**Pattern**: Single source of truth in `types/profile-consolidated.ts`.

**Quick Example**:

```typescript
// Database types (authoritative)
type UserProfile = Database['public']['Tables']['profiles']['Row']

// Form-specific types
type BasicInfoFormData = Pick<UserProfile, 'date_of_birth' | 'zip_code'>

// Never duplicate - derive from database types
```

**Key Principle**: Database schema is authoritative. All other types derive from it.

**Full Guide**: See type definitions in `src/lib/types/profile-consolidated.ts`

---

## Enhanced Logging

**Pattern**: Use `logger-enhanced.ts` for all logging. Never `console.log`.

**Quick Example**:

```typescript
import { logger } from '@/lib/utils/logger-enhanced'

// Error logging
logger.error('Operation failed', {
  context: 'API:Tasks',
  error: error as Error, // ALWAYS cast to Error
  userId,
  taskId,
})

// Info logging
logger.info('Action completed', {
  context: 'Services:Provider',
  providerId,
})
```

**Context Prefixes**:

- `Auth:*`, `Services:*`, `API:*`, `Profile:*`, `Recommendations:*`, `Pages:*`

**Critical**: Always cast errors to `Error` type for strict TypeScript.

**Full Guide**: See [`docs/standards/LOGGING_GUIDE.md`](standards/LOGGING_GUIDE.md) and [`src/lib/CLAUDE.md`](../src/lib/CLAUDE.md)

---

## TypeScript Strict Mode

**Pattern**: Stricter-than-normal TypeScript settings.

**Key Settings**:

- `exactOptionalPropertyTypes: true` - Cannot set optional to `undefined`
- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`

**Quick Example**:

```typescript
// ❌ WRONG
interface Options {
  specialty?: string
}
const opts: Options = { specialty: value || undefined }

// ✅ CORRECT
const opts: Options = {}
if (value) opts.specialty = value

// ❌ WRONG
const first = name.split(' ')[0] // Could be undefined

// ✅ CORRECT
const first = name.split(' ')[0] || ''
```

**Full Guide**: See [`docs/standards/TYPESCRIPT_STRICT_MODE.md`](standards/TYPESCRIPT_STRICT_MODE.md)

---

## Security Best Practices

**Pattern**: Defense in depth with authentication, RLS, input validation.

**Quick Checklist**:

- ✅ Clerk for authentication
- ✅ Row Level Security on all Supabase tables
- ✅ Input validation with Zod
- ✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` on client
- ✅ Secret scanning with Gitleaks pre-commit hook
- ✅ CSP headers in middleware

**Example RLS Policy**:

```sql
CREATE POLICY "Users can only see own profile"
ON profiles FOR SELECT
USING (auth.uid() = clerk_user_id);
```

**Full Guide**: See [`docs/standards/SECURITY_BEST_PRACTICES.md`](standards/SECURITY_BEST_PRACTICES.md)

---

## Testing Strategy

**Pattern**: Comprehensive testing with unit, integration, and e2e tests.

**Quick Example**:

```typescript
// Unit test
import { describe, it, expect } from 'vitest'

describe('formatDate', () => {
  it('formats dates correctly', () => {
    expect(formatDate('2025-10-19')).toBe('Oct 19, 2025')
  })
})

// E2E test
import { test, expect } from '@playwright/test'

test('user can sign in', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Sign In')
  await expect(page).toHaveURL('/dashboard')
})
```

**Testing Layers**:

- Unit: Business logic, utilities
- Integration: API routes, server actions
- E2E: User workflows with Playwright

**Full Guide**: See [`docs/standards/TESTING_STRATEGY.md`](standards/TESTING_STRATEGY.md)

---

## Implementation Checklist

Before starting new work:

- [ ] Review relevant standard file for patterns
- [ ] Check directory-specific CLAUDE.md (`src/app/`, `src/lib/`, `src/components/`)
- [ ] Understand the "why" behind the pattern
- [ ] Review code examples
- [ ] Check for recent updates to standards

When creating new patterns:

- [ ] Document in appropriate standard file
- [ ] Add 15-20 line summary to this quick reference
- [ ] Update directory-specific CLAUDE.md if relevant
- [ ] Add examples to code
- [ ] Update changelog

---

## Development Workflow Quick Reference

### Starting Work

1. Read `docs/db/CURRENT_SCHEMA_BASELINE_2025.md` if touching database
2. Check relevant CLAUDE.md file for implementation details
3. Use `/schema-check` command if unsure about database

### During Development

1. Use `npm run type-check:watch` for real-time TypeScript checking
2. Use validated components for all forms
3. Use Supabase factory for all database access
4. Use enhanced logger for all logging

### Before Committing

1. Run `/check` command (type-check + lint + format)
2. Test in localhost:3000
3. Review changes for consistency with standards

### Before Deploying

1. Run `/validate` command (full validation + build)
2. Get user approval
3. Use `/deploy` command for automated deployment

---

## Related Documentation

**Directory-Specific Guides**:

- [`src/app/CLAUDE.md`](../src/app/CLAUDE.md) - Next.js App Router patterns
- [`src/lib/CLAUDE.md`](../src/lib/CLAUDE.md) - Supabase, validation, logging
- [`src/components/CLAUDE.md`](../src/components/CLAUDE.md) - UI/UX standards
- [`docs/CLAUDE.md`](CLAUDE.md) - Documentation maintenance

**Comprehensive Standards**:

- [`TYPESCRIPT_STRICT_MODE.md`](standards/TYPESCRIPT_STRICT_MODE.md)
- [`SECURITY_BEST_PRACTICES.md`](standards/SECURITY_BEST_PRACTICES.md)
- [`API_STANDARDS.md`](standards/API_STANDARDS.md)
- [`DATABASE_PATTERNS.md`](standards/DATABASE_PATTERNS.md)
- [`LOGGING_GUIDE.md`](standards/LOGGING_GUIDE.md)
- [`VALIDATION_PATTERNS.md`](standards/VALIDATION_PATTERNS.md)
- [`TESTING_STRATEGY.md`](standards/TESTING_STRATEGY.md)

**Project Context**:

- Root [`CLAUDE.md`](../CLAUDE.md) - High-level project guide
- [`README.md`](README.md) - Tech stack and architecture
- [`TEMPLATE_USAGE.md`](TEMPLATE_USAGE.md) - Using as project template

---

## Changelog

- 2025-10-19: Consolidated from 1,435 lines to ~400 lines quick reference format
- Previous: Contained full implementation details (now moved to standard files)
