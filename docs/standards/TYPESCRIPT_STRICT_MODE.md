# TypeScript Strict Mode Guide

Comprehensive guide for working with TypeScript's strictest settings: `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.

## Table of Contents

- [Overview](#overview)
- [exactOptionalPropertyTypes](#exactoptionalpropertytypes)
- [noUncheckedIndexedAccess](#nouncheckedindexedaccess)
- [Common Patterns](#common-patterns)
- [Migration Guide](#migration-guide)

## Overview

Our TypeScript configuration uses stricter-than-normal settings that catch more potential bugs at compile time but require careful handling of optional properties and array access.

### Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## exactOptionalPropertyTypes

### What It Does

With `exactOptionalPropertyTypes: true`, optional properties **cannot** be set to `undefined`. They can only be:

1. Present with the correct type
2. Omitted entirely

### The Problem

```typescript
// ❌ WRONG - This will cause a TypeScript error
interface Options {
  specialty?: string
}

const value: string | undefined = getValue()
const opts: Options = { specialty: value }
// Error: undefined is not assignable to string | undefined
```

### Solutions

#### Solution 1: Conditional Property Assignment

```typescript
// ✅ CORRECT - Only add property if value exists
interface Options {
  specialty?: string
}

const value: string | undefined = getValue()

const opts: Options = {}
if (value) {
  opts.specialty = value
}

// Or using spread:
const opts: Options = {
  ...(value && { specialty: value }),
}
```

#### Solution 2: Remove Optional Modifier

```typescript
// ✅ CORRECT - Explicitly allow undefined
interface Options {
  specialty: string | undefined // NOT optional, explicitly allows undefined
}

const value: string | undefined = getValue()
const opts: Options = { specialty: value } // Now this works
```

#### Solution 3: Use Type Guard

```typescript
// ✅ CORRECT - Guard against undefined before assignment
interface Options {
  specialty?: string
}

const value: string | undefined = getValue()

const opts: Options = {}
if (value !== undefined && value !== null) {
  opts.specialty = value
}
```

### Real-World Examples

#### Form Data Construction

```typescript
// ❌ WRONG
interface FormData {
  email?: string
  phone?: string
}

const formData: FormData = {
  email: userInput.email || undefined, // Error!
  phone: userInput.phone || undefined, // Error!
}

// ✅ CORRECT - Version 1: Conditional assignment
const formData: FormData = {}
if (userInput.email) formData.email = userInput.email
if (userInput.phone) formData.phone = userInput.phone

// ✅ CORRECT - Version 2: Spread operator
const formData: FormData = {
  ...(userInput.email && { email: userInput.email }),
  ...(userInput.phone && { phone: userInput.phone }),
}

// ✅ CORRECT - Version 3: Remove optional
interface FormData {
  email: string | undefined
  phone: string | undefined
}

const formData: FormData = {
  email: userInput.email || undefined,
  phone: userInput.phone || undefined,
}
```

#### API Request Construction

```typescript
interface SearchParams {
  query: string
  filter?: string
  limit?: number
}

// ❌ WRONG
const params: SearchParams = {
  query: searchTerm,
  filter: selectedFilter || undefined, // Error!
  limit: pageSize || undefined, // Error!
}

// ✅ CORRECT
const params: SearchParams = {
  query: searchTerm,
  ...(selectedFilter && { filter: selectedFilter }),
  ...(pageSize && { limit: pageSize }),
}
```

#### Logger Context Building

```typescript
interface LogContext {
  context: string
  requestId?: string
  error?: Error
}

// ❌ WRONG
const errorObj: LogContext = {
  context: 'API',
  requestId: req.id,
  error: maybeError || undefined, // Error!
}

// ✅ CORRECT - Version 1: Build incrementally
const errorObj: LogContext = {
  context: 'API',
  requestId: req.id,
}
if (maybeError) {
  errorObj.error = maybeError
}

// ✅ CORRECT - Version 2: Object.assign pattern
const errorObj: LogContext = { context: 'API', requestId: req.id }
if (maybeError) {
  Object.assign(errorObj, { error: maybeError })
}

// ✅ CORRECT - Version 3: Spread
const errorObj: LogContext = {
  context: 'API',
  requestId: req.id,
  ...(maybeError && { error: maybeError }),
}
```

## noUncheckedIndexedAccess

### What It Does

With `noUncheckedIndexedAccess: true`, accessing arrays or objects by index returns `T | undefined`, not just `T`.

### The Problem

```typescript
// ❌ WRONG - parts[0] is string | undefined, not string
const parts = name.split(' ')
const first = parts[0] // Type: string | undefined
const upper = first.toUpperCase() // Error: Object is possibly undefined
```

### Solutions

#### Solution 1: Provide Default Value

```typescript
// ✅ CORRECT - Use || or ?? for default
const parts = name.split(' ')
const first = parts[0] || ''
const upper = first.toUpperCase() // Works: first is now string

// Or with nullish coalescing
const first = parts[0] ?? ''
```

#### Solution 2: Non-Null Assertion (Use Sparingly)

```typescript
// ✅ CORRECT - Only if you're 100% certain it exists
const parts = name.split(' ')
const first = parts[0]! // Non-null assertion
const upper = first.toUpperCase()

// Better: Add runtime check
if (parts.length === 0) throw new Error('Name cannot be empty')
const first = parts[0]!
```

#### Solution 3: Optional Chaining

```typescript
// ✅ CORRECT - Safe access with optional chaining
const parts = name.split(' ')
const upper = parts[0]?.toUpperCase() ?? ''
```

#### Solution 4: Type Guard

```typescript
// ✅ CORRECT - Explicit check
const parts = name.split(' ')
const first = parts[0]

if (first !== undefined) {
  const upper = first.toUpperCase() // TypeScript knows first is string
}

// Or with early return
if (!parts[0]) {
  return null
}
const first = parts[0] // TypeScript knows it's defined
```

### Real-World Examples

#### Array Element Access

```typescript
// ❌ WRONG
const medications = await getMedications()
const firstMed = medications[0]
console.log(firstMed.name) // Error: Object is possibly undefined

// ✅ CORRECT - Version 1: Default value
const firstMed = medications[0] ?? { name: 'No medications' }
console.log(firstMed.name)

// ✅ CORRECT - Version 2: Check before use
if (medications[0]) {
  console.log(medications[0].name)
}

// ✅ CORRECT - Version 3: Optional chaining
console.log(medications[0]?.name ?? 'No medications')
```

#### Object Property Access

```typescript
// ❌ WRONG
const config: Record<string, string> = getConfig()
const apiKey = config['apiKey']
return apiKey.substring(0, 10) // Error: Object is possibly undefined

// ✅ CORRECT - Version 1: Default value
const apiKey = config['apiKey'] ?? ''
return apiKey.substring(0, 10)

// ✅ CORRECT - Version 2: Optional chaining
return config['apiKey']?.substring(0, 10) ?? 'NO_KEY'

// ✅ CORRECT - Version 3: Type guard
const apiKey = config['apiKey']
if (!apiKey) {
  throw new Error('API key not found')
}
return apiKey.substring(0, 10)
```

#### Array Destructuring

```typescript
// ❌ WRONG
const [first, last] = name.split(' ')
console.log(first.toUpperCase(), last.toUpperCase()) // Both possibly undefined

// ✅ CORRECT - Provide defaults
const [first = '', last = ''] = name.split(' ')
console.log(first.toUpperCase(), last.toUpperCase())

// ✅ CORRECT - Check length first
const parts = name.split(' ')
if (parts.length < 2) {
  throw new Error('Full name required')
}
const [first, last] = parts // Now guaranteed to exist
console.log(first!.toUpperCase(), last!.toUpperCase())
```

#### Map/Filter Operations

```typescript
// ❌ WRONG
const ids = items.map(item => item.id)
const firstId = ids[0]
return firstId.toUpperCase() // Error: Object is possibly undefined

// ✅ CORRECT - Version 1: at() with default
const firstId = ids.at(0) ?? ''
return firstId.toUpperCase()

// ✅ CORRECT - Version 2: Check emptiness
if (ids.length === 0) return ''
return ids[0]!.toUpperCase()

// ✅ CORRECT - Version 3: Use find/first pattern
const firstItem = items.find(() => true) // Gets first item
if (!firstItem) return ''
return firstItem.id.toUpperCase()
```

## Common Patterns

### Building Objects Conditionally

```typescript
interface ApiRequest {
  endpoint: string
  method: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

function makeRequest(options: {
  endpoint: string
  body?: Record<string, unknown>
  token?: string
}) {
  // ✅ Pattern: Build base object, then conditionally add
  const request: ApiRequest = {
    endpoint: options.endpoint,
    method: 'POST',
  }

  if (options.body) {
    request.body = options.body
  }

  if (options.token) {
    request.headers = {
      Authorization: `Bearer ${options.token}`,
    }
  }

  return request
}

// Alternative: Spread pattern
function makeRequest(options: {
  endpoint: string
  body?: Record<string, unknown>
  token?: string
}) {
  return {
    endpoint: options.endpoint,
    method: 'POST',
    ...(options.body && { body: options.body }),
    ...(options.token && {
      headers: { Authorization: `Bearer ${options.token}` },
    }),
  } as ApiRequest
}
```

### Safe Array Access Pattern

```typescript
// ✅ Reusable helper
function firstOr<T>(arr: T[], defaultValue: T): T {
  return arr[0] ?? defaultValue
}

// Usage
const medications = await getMedications()
const firstMed = firstOr(medications, { name: 'None', dose: '' })

// Or make it more explicit
function getFirstOrThrow<T>(arr: T[], errorMessage: string): T {
  const first = arr[0]
  if (first === undefined) {
    throw new Error(errorMessage)
  }
  return first
}
```

### Type Guards for Complex Checks

```typescript
// ✅ Create type guards for repeated patterns
function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

// Usage
const values = ['a', undefined, 'b', undefined]
const definedValues = values.filter(isDefined) // Type: string[]

// For objects
function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj && obj[key as keyof T] !== undefined
}
```

## Migration Guide

### Step 1: Enable Strict Flags

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Step 2: Run Type Check

```bash
npm run type-check
```

### Step 3: Fix Errors Systematically

1. **Fix `exactOptionalPropertyTypes` errors first**
   - Search for: `|| undefined`
   - Replace with conditional assignment or spread patterns

2. **Fix `noUncheckedIndexedAccess` errors**
   - Search for: `[0]`, `[1]`, etc.
   - Add default values or guards

3. **Use IDE refactoring**
   - VS Code can help with bulk fixes
   - Use "Go to Next Problem" (F8)

### Step 4: Test Thoroughly

- Run full test suite
- Manual testing of critical paths
- Verify no runtime errors introduced

## Best Practices

1. **Prefer conditional assignment over non-null assertions**
   - Non-null assertions (`!`) disable type checking
   - Only use when you're 100% certain

2. **Use type guards for complex conditions**
   - Makes code more readable
   - Reusable across codebase

3. **Provide meaningful defaults**
   - Empty strings, empty arrays, etc.
   - Document why defaults are chosen

4. **Consider removing optional when appropriate**
   - If a field can be undefined, make it explicit: `field: T | undefined`
   - Saves conditional assignment boilerplate

5. **Use optional chaining liberally**
   - `obj?.prop?.subProp ?? defaultValue`
   - Cleaner than nested if statements

## Additional Resources

- [TypeScript Handbook: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
- [TypeScript Handbook: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
