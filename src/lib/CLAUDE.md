# src/lib - Core Utilities & Services

This directory contains reusable business logic, database clients, validation schemas, and utility functions.

## Supabase Client Factory Pattern

**CRITICAL**: Always use the `SupabaseClients` factory from `supabase/factory.ts`. Never call `createClient()` directly.

### Decision Tree

```typescript
// ✅ User operations (respects RLS)
const supabase = await SupabaseClients.authenticated()

// ✅ Admin operations (bypasses RLS)
const supabase = SupabaseClients.admin()

// ✅ Public data access
const supabase = await SupabaseClients.public()

// ✅ Client-side operations (singleton)
const supabase = SupabaseClients.browser()
```

**When to use each**:

- `authenticated()` - **Default** for user operations (profiles, user data, user-specific queries)
- `admin()` - **Only** for webhooks, system operations, admin endpoints that bypass RLS
- `public()` - Public pages, health checks, non-authenticated data access
- `browser()` - Client-side React components needing database access

**Common mistake**: Using `admin()` when you should use `authenticated()`. Admin bypasses RLS which can expose data incorrectly.

See `supabase/README.md` for complete factory documentation.

## Unified Validation System

Forms use centralized validation with Zod schemas from `validation/`.

### Basic Usage

```typescript
import { useValidatedForm } from '@/lib/validation/useValidatedForm'
import { MySchema } from '@/lib/validation/schemas/my-schema'

const { values, errors, touched, handleSubmit } = useValidatedForm({
  schema: MySchema,
  initialValues: defaultValues,
  onSubmit: handleFormSubmit,
})
```

### Validated Components

Always use these instead of raw input elements:

- `<ValidatedInput>` - Text, email, password inputs
- `<ValidatedSelect>` - Dropdowns
- `<ValidatedCheckbox>` - Checkboxes
- `<ValidatedTextarea>` - Multi-line text

**Why**: Consistent error handling, accessibility, styling.

See `validation/README.md` for complete validation architecture.

## Enhanced Logger

**ALL logging must use** `utils/logger-enhanced.ts`. Never use `console.log/warn/error` directly.

### Basic Usage

```typescript
import { logger } from '@/lib/utils/logger-enhanced'

// Error logging
logger.error('Operation failed', {
  context: 'API:Tasks',
  error: error as Error, // ALWAYS cast to Error
  userId,
  taskId,
})

// Warning logging
logger.warn('Unexpected condition', {
  context: 'Services:Provider',
  providerId,
  reason: 'NPI not found',
})

// Info logging
logger.info('Action completed', {
  context: 'Profile:BasicInfo',
  userId,
  changes: ['email', 'phone'],
})
```

### Critical Patterns

1. **Always cast errors**: `error as Error` (required for strict TypeScript)
2. **Context prefixes**: Use consistent prefixes for easy filtering
3. **Optional properties**: Use conditional assignment for `exactOptionalPropertyTypes`

```typescript
// ❌ WRONG - undefined not allowed
logger.warn('Message', { context: 'Foo', error: maybeError || undefined })

// ✅ CORRECT - conditional assignment
const logData = { context: 'Foo' }
if (maybeError) {
  Object.assign(logData, { error: maybeError })
}
logger.warn('Message', logData)
```

### Standard Context Prefixes

- **Auth**: `Auth:Admin`, `Auth:Webhook`, `Auth:Session`
- **Services**: `Services:Provider`, `Services:Medication`, `Services:Cache`
- **Profile**: `Profile:BasicInfo`, `Profile:Health`, `Profile:Wizard`
- **Recommendations**: `Recommendations:Generate`, `Recommendations:SaveModal`
- **Pages**: `Pages:Home`, `Pages:Recommendations`, `Pages:Compare`
- **API**: `API:Medications`, `API:Marketplace`

See `docs/standards/LOGGING_GUIDE.md` for comprehensive logging patterns.

## API Response Standardization

All API routes use helpers from `api/response.ts`:

```typescript
import { apiSuccess, apiError } from '@/lib/api/response'

// Success
return apiSuccess(data, 200, requestId)

// Error
return apiError('Error message', 'ERROR_CODE', 500, requestId)
```

**Always include request ID** for tracing. Generate with:

```typescript
const requestId = crypto.randomUUID()
```

See `docs/standards/API_STANDARDS.md` for complete API patterns.

## Type System

### Profile Types

**Single source of truth**: `types/profile-consolidated.ts`

```typescript
// Database types (authoritative)
type UserProfile = Database['public']['Tables']['profiles']['Row']

// Form-specific types
type BasicInfoFormData = Pick<UserProfile, 'date_of_birth' | 'zip_code' | ...>
```

### TypeScript Strict Mode

This project uses **stricter-than-normal** settings:

- `exactOptionalPropertyTypes: true` - Cannot set optional properties to `undefined`
- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`

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
const parts = name.split(' ')
const first = parts[0] // Error: could be undefined

// ✅ CORRECT
const first = parts[0] || ''
```

See `docs/standards/TYPESCRIPT_STRICT_MODE.md` for comprehensive guide.

## Service Layer Patterns

Business logic lives in `services/` directory:

- `services/provider.ts` - Provider network validation
- `services/medication.ts` - Medication lookups
- `services/cache.ts` - Cache management
- `services/medicare-api.ts` - External API calls

**Pattern**: Services are async functions that:

1. Accept typed parameters
2. Use appropriate Supabase client (usually `authenticated()`)
3. Handle errors with try/catch
4. Log with enhanced logger
5. Return typed results or throw

```typescript
export async function getProviderById(npi: string): Promise<Provider> {
  try {
    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('npi', npi)
      .single()

    if (error) throw error
    if (!data) throw new Error('Provider not found')

    logger.info('Provider fetched', {
      context: 'Services:Provider',
      npi,
    })

    return data
  } catch (error) {
    logger.error('Failed to fetch provider', {
      context: 'Services:Provider',
      error: error as Error,
      npi,
    })
    throw error
  }
}
```

## Common Mistakes in lib/

1. **Direct Supabase client creation** - Always use factory
2. **console.log instead of logger** - Use enhanced logger
3. **Not handling array access** - Check for undefined
4. **Setting optional properties to undefined** - Use conditional assignment
5. **Missing error context** - Always include relevant IDs in logger

## Key Documentation

- `supabase/README.md` - Database client usage
- `validation/README.md` - Validation system architecture
- `docs/standards/DATABASE_PATTERNS.md` - Database best practices
- `docs/standards/VALIDATION_PATTERNS.md` - Form validation patterns
- `docs/standards/LOGGING_GUIDE.md` - Logging standards
- `docs/standards/TYPESCRIPT_STRICT_MODE.md` - TypeScript configuration
