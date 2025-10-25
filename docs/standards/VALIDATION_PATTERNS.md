# Validation Patterns

**Unified validation system using Zod for forms, API routes, and database operations**

Based on production patterns from MedicareMagic and AuthorMagic.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Validation Architecture](#validation-architecture)
3. [Form Validation](#form-validation)
4. [API Validation](#api-validation)
5. [Database Validation](#database-validation)
6. [Custom Validators](#custom-validators)
7. [Error Handling](#error-handling)
8. [Common Patterns](#common-patterns)

---

## Core Concepts

### Validation Stack

```
User Input → Zod Schema → Type-Safe Data → Business Logic
     ↓            ↓              ↓              ↓
  Raw Data   Validation    Typed Output    Database
```

### Key Principles

1. **Single Source of Truth**: One Zod schema per domain entity
2. **Type Inference**: Let TypeScript infer types from schemas
3. **Reusable Schemas**: Share schemas across client and server
4. **Progressive Enhancement**: Client-side validation + server-side enforcement
5. **User-Friendly Errors**: Clear, actionable error messages

---

## Validation Architecture

### Directory Structure

```
src/lib/validation/
├── schemas/
│   ├── profile.ts           # User profile validation
│   ├── medication.ts         # Medication validation
│   ├── provider.ts           # Provider validation
│   └── auth.ts              # Authentication validation
├── hooks/
│   └── useValidatedForm.ts  # Form validation hook
├── utils/
│   ├── validators.ts         # Custom validators
│   └── error-formatter.ts    # Error formatting
└── index.ts                  # Exports
```

### Base Schema Pattern

```typescript
// src/lib/validation/schemas/profile.ts
import { z } from 'zod'

// Base schema
export const ProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

// Derived schemas
export const ProfileUpdateSchema = ProfileSchema.partial()
export const ProfileCreateSchema = ProfileSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Type inference
export type Profile = z.infer<typeof ProfileSchema>
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>
```

---

## Form Validation

### useValidatedForm Hook

```typescript
// src/lib/validation/hooks/useValidatedForm.ts
import { useState } from 'react'
import { z } from 'zod'

export function useValidatedForm<T extends z.ZodTypeAny>({
  schema,
  initialValues,
  onSubmit,
}: {
  schema: T
  initialValues: z.infer<T>
  onSubmit: (values: z.infer<T>) => Promise<void> | void
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))

    // Clear error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))

    // Validate single field on blur
    try {
      const fieldSchema = schema.shape[field]
      if (fieldSchema) {
        fieldSchema.parse(values[field])
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: err.errors[0]?.message || 'Invalid value',
        }))
      }
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    )
    setTouched(allTouched)

    // Validate all fields
    const result = schema.safeParse(values)

    if (!result.success) {
      const fieldErrors = result.error.errors.reduce(
        (acc, err) => ({
          ...acc,
          [err.path.join('.')]: err.message,
        }),
        {}
      )
      setErrors(fieldErrors)
      return
    }

    // Submit valid data
    setIsSubmitting(true)
    try {
      await onSubmit(result.data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors,
  }
}
```

### Validated Form Components

```typescript
// ValidatedInput.tsx
interface ValidatedInputProps {
  name: string
  label: string
  type?: string
  value: string
  error?: string
  touched?: boolean
  onChange: (field: string, value: string) => void
  onBlur: (field: string) => void
}

export function ValidatedInput({
  name,
  label,
  type = 'text',
  value,
  error,
  touched,
  onChange,
  onBlur,
}: ValidatedInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={cn(
          'w-full px-3 py-2 border rounded-md',
          touched && error ? 'border-red-500' : 'border-gray-300'
        )}
      />
      {touched && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

### Usage Example

```typescript
// ProfileForm.tsx
import { useValidatedForm } from '@/lib/validation/hooks/useValidatedForm'
import { ProfileSchema } from '@/lib/validation/schemas/profile'
import { ValidatedInput } from '@/components/ui/ValidatedInput'

export function ProfileForm() {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useValidatedForm({
      schema: ProfileSchema,
      initialValues: {
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
      },
      onSubmit: async (data) => {
        await updateProfile(data)
      },
    })

  return (
    <form onSubmit={handleSubmit}>
      <ValidatedInput
        name="firstName"
        label="First Name"
        value={values.firstName}
        error={errors.firstName}
        touched={touched.firstName}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <ValidatedInput
        name="email"
        label="Email"
        type="email"
        value={values.email}
        error={errors.email}
        touched={touched.email}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <button type="submit">Save Profile</button>
    </form>
  )
}
```

---

## API Validation

### API Route Pattern

```typescript
// app/api/profile/route.ts
import { z } from 'zod'
import { ProfileUpdateSchema } from '@/lib/validation/schemas/profile'
import { apiSuccess, apiError } from '@/lib/api/response'

export async function PUT(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    // Parse request body
    const body = await request.json()

    // Validate with Zod
    const result = ProfileUpdateSchema.safeParse(body)

    if (!result.success) {
      return apiError('Validation failed', 'VALIDATION_ERROR', 400, requestId, {
        errors: result.error.format(),
      })
    }

    // Type-safe data
    const validatedData = result.data

    // Business logic
    const profile = await updateProfile(validatedData)

    return apiSuccess(profile, 200, requestId)
  } catch (error) {
    logger.error('Profile update failed', {
      context: 'API:Profile',
      error: error as Error,
      requestId,
    })

    return apiError('Internal server error', 'SERVER_ERROR', 500, requestId)
  }
}
```

### Server Action Pattern

```typescript
// lib/actions/profile.ts
'use server'

import { z } from 'zod'
import { ProfileUpdateSchema } from '@/lib/validation/schemas/profile'

export async function updateProfileAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Convert FormData to object
    const data = Object.fromEntries(formData)

    // Validate
    const result = ProfileUpdateSchema.safeParse(data)

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0]?.message || 'Validation failed',
      }
    }

    // Update profile
    const profile = await updateProfile(result.data)

    return { success: true, data: profile }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update profile',
    }
  }
}
```

---

## Database Validation

### Insert Validation

```typescript
// lib/services/profile.ts
import { ProfileCreateSchema } from '@/lib/validation/schemas/profile'
import { SupabaseClients } from '@/lib/supabase/factory'

export async function createProfile(data: unknown) {
  // Validate input
  const validatedData = ProfileCreateSchema.parse(data)

  // Database operation
  const supabase = await SupabaseClients.authenticated()
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert(validatedData)
    .select()
    .single()

  if (error) throw error
  return profile
}
```

### Update Validation

```typescript
export async function updateProfile(id: string, data: unknown) {
  // Validate input
  const validatedData = ProfileUpdateSchema.parse(data)

  // Only include defined fields (exactOptionalPropertyTypes compliance)
  const updateData: Record<string, any> = {}
  Object.entries(validatedData).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value
    }
  })

  const supabase = await SupabaseClients.authenticated()
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return profile
}
```

---

## Custom Validators

### Common Validators

```typescript
// lib/validation/utils/validators.ts
import { z } from 'zod'

// ZIP code (US)
export const zipCodeValidator = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')

// Phone number (US)
export const phoneValidator = z
  .string()
  .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number')

// Date of birth (must be 18+)
export const dateOfBirthValidator = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine(date => {
    const age = new Date().getFullYear() - new Date(date).getFullYear()
    return age >= 18
  }, 'Must be at least 18 years old')

// NPI (National Provider Identifier)
export const npiValidator = z
  .string()
  .regex(/^\d{10}$/, 'NPI must be exactly 10 digits')

// Password strength
export const passwordValidator = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
```

### Conditional Validation

```typescript
// Conditional fields based on other values
export const MedicationSchema = z
  .object({
    name: z.string().min(1, 'Medication name required'),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    isPrescription: z.boolean(),
    prescribedBy: z.string().optional(),
  })
  .refine(
    data => {
      // If prescription, prescribedBy is required
      if (data.isPrescription && !data.prescribedBy) {
        return false
      }
      return true
    },
    {
      message: 'Prescriber required for prescription medications',
      path: ['prescribedBy'],
    }
  )
```

---

## Error Handling

### Error Formatting

```typescript
// lib/validation/utils/error-formatter.ts
import { ZodError } from 'zod'

export function formatZodError(error: ZodError): Record<string, string> {
  return error.errors.reduce(
    (acc, err) => {
      const path = err.path.join('.')
      acc[path] = err.message
      return acc
    },
    {} as Record<string, string>
  )
}

export function getFirstError(error: ZodError): string {
  return error.errors[0]?.message || 'Validation failed'
}
```

### User-Friendly Messages

```typescript
// Custom error messages
export const MedicationSchema = z.object({
  name: z.string().min(1, 'Please enter the medication name'),
  dosage: z.string().min(1, 'Please specify the dosage (e.g., 10mg)'),
  frequency: z.enum(['daily', 'twice_daily', 'as_needed'], {
    errorMap: () => ({
      message: 'Please select how often you take this medication',
    }),
  }),
})
```

---

## Common Patterns

### Array Validation

```typescript
export const MedicationListSchema = z.object({
  medications: z
    .array(MedicationSchema)
    .min(1, 'Add at least one medication')
    .max(50, 'Maximum 50 medications allowed'),
})
```

### Nested Object Validation

```typescript
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address required'),
  city: z.string().min(1, 'City required'),
  state: z.string().length(2, 'State must be 2 letters'),
  zipCode: zipCodeValidator,
})

export const ProfileWithAddressSchema = ProfileSchema.extend({
  address: AddressSchema,
})
```

### Transform and Refine

```typescript
// Transform input before validation
export const DateInputSchema = z
  .string()
  .transform(val => new Date(val))
  .refine(date => !isNaN(date.getTime()), {
    message: 'Invalid date',
  })

// Refine with custom logic
export const ProviderSearchSchema = z
  .object({
    zipCode: zipCodeValidator,
    radius: z.number().int().min(1).max(100).default(25),
    specialty: z.string().optional(),
  })
  .refine(
    data => {
      // If specialty provided, must be valid
      if (data.specialty) {
        return validSpecialties.includes(data.specialty)
      }
      return true
    },
    {
      message: 'Invalid specialty selected',
      path: ['specialty'],
    }
  )
```

---

## Best Practices

### 1. Schema Organization

```typescript
// ✅ GOOD - Organized by domain
src/lib/validation/schemas/
  ├── profile.ts
  ├── medication.ts
  └── provider.ts

// ❌ BAD - Single mega file
src/lib/validation/
  └── schemas.ts (1000+ lines)
```

### 2. Type Inference

```typescript
// ✅ GOOD - Infer types from schemas
export const UserSchema = z.object({ ... })
export type User = z.infer<typeof UserSchema>

// ❌ BAD - Duplicate type definitions
export type User = { ... }
export const UserSchema = z.object({ ... })
```

### 3. Reusable Validators

```typescript
// ✅ GOOD - Reusable validators
export const emailValidator = z.string().email()
export const UserSchema = z.object({
  email: emailValidator,
})

// ❌ BAD - Inline validation
export const UserSchema = z.object({
  email: z.string().email(),
})
```

### 4. Server-Side Enforcement

```typescript
// ✅ GOOD - Always validate on server
export async function POST(request: Request) {
  const data = await request.json()
  const validated = Schema.parse(data) // Throws if invalid
  // ... use validated data
}

// ❌ BAD - Trust client input
export async function POST(request: Request) {
  const data = await request.json() // Unvalidated!
  await saveToDatabase(data)
}
```

---

## Migration Checklist

### Adding Validation to Existing Forms

- [ ] Create Zod schema for form data
- [ ] Replace useState with useValidatedForm hook
- [ ] Add ValidatedInput components
- [ ] Add server-side validation to API route
- [ ] Test error messages with invalid input
- [ ] Test success case with valid input

### Adding Validation to Existing APIs

- [ ] Create Zod schema for request body
- [ ] Add safeParse() validation
- [ ] Return 400 with formatted errors on failure
- [ ] Update TypeScript types to use inferred types
- [ ] Test with invalid payloads
- [ ] Update API documentation

---

## Troubleshooting

### Common Issues

**Issue**: `exactOptionalPropertyTypes` error when setting optional field to undefined

```typescript
// ❌ WRONG
const data: { name?: string } = { name: undefined }

// ✅ CORRECT
const data: { name?: string } = {}
if (value) data.name = value
```

**Issue**: Zod transform not working in schema

```typescript
// ✅ Make sure transform comes before parse
const schema = z.string().transform(val => val.toUpperCase())
const result = schema.parse('hello') // 'HELLO'
```

**Issue**: Custom error messages not showing

```typescript
// ✅ Use errorMap for enums and refinements
z.enum(['a', 'b'], {
  errorMap: () => ({ message: 'Custom message' }),
})
```

---

_See also: [API_STANDARDS.md](./API_STANDARDS.md), [TYPESCRIPT_STRICT_MODE.md](./TYPESCRIPT_STRICT_MODE.md)_
