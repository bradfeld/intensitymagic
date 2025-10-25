# API Response Standardization

Standard patterns for API routes with consistent response format, error handling, and logging.

## Response Format

All API routes return standardized JSON responses:

### Success Response

```typescript
{
  success: true,
  data: { /* your data */ },
  metadata: {
    timestamp: "2025-01-15T10:30:00.000Z",
    requestId: "req_1234567890_abc123"
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  details: { /* optional additional context */ },
  metadata: {
    timestamp: "2025-01-15T10:30:00.000Z",
    requestId: "req_1234567890_abc123"
  }
}
```

## Helper Functions

Located in `src/lib/api/response.ts`:

```typescript
import {
  apiSuccess,
  apiError,
  ApiErrors,
  validateInput,
} from '@/lib/api/response'
```

### apiSuccess()

```typescript
// Basic usage
return apiSuccess(data, 200, requestId)

// Example
return apiSuccess({ id: '123', name: 'Task' }, 200, requestId)
```

### apiError()

```typescript
// Basic usage
return apiError(message, status, code, details, requestId, context)

// Example
return apiError(
  'Task not found',
  404,
  'TASK_NOT_FOUND',
  { taskId: id },
  requestId,
  'API:tasks'
)
```

### ApiErrors (Pre-defined)

```typescript
// 401 Unauthorized
return ApiErrors.unauthorized(requestId)

// 403 Forbidden
return ApiErrors.forbidden(requestId)

// 404 Not Found
return ApiErrors.notFound('Task', requestId)

// 400 Validation Error
return ApiErrors.validationError(details, requestId)

// 405 Method Not Allowed
return ApiErrors.methodNotAllowed('POST', requestId)

// 409 Conflict
return ApiErrors.conflict('Task already exists', requestId)

// 429 Rate Limited
return ApiErrors.rateLimited(retryAfter, requestId)

// 500 Internal Error
return ApiErrors.internalError('Database connection failed', requestId)

// 503 Service Unavailable
return ApiErrors.serviceUnavailable('OpenAI', requestId)
```

### validateInput()

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  age: z.number().min(0),
})

const validation = validateInput(schema, body, requestId)

if (!validation.success) {
  return validation.response // Returns formatted error
}

const validatedData = validation.data
```

## Standard API Route Template

```typescript
import { type NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import {
  apiSuccess,
  apiError,
  ApiErrors,
  validateInput,
} from '@/lib/api/response'
import { SupabaseClients } from '@/lib/supabase/factory'
import { logger } from '@/lib/utils/logger-enhanced'

// Request validation
const RequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = logger.generateRequestId()

  try {
    // 1. Log request
    logger.info('POST request received', {
      context: 'API:tasks',
      requestId,
    })

    // 2. Check authentication
    const { userId } = await auth()
    if (!userId) {
      return ApiErrors.unauthorized(requestId)
    }

    // 3. Parse and validate body
    const body = await request.json()
    const validation = validateInput(RequestSchema, body, requestId)

    if (!validation.success) {
      return validation.response
    }

    // 4. Business logic
    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          ...validation.data,
        },
      ])
      .select()
      .single()

    if (error) {
      return apiError(
        error.message,
        500,
        'DATABASE_ERROR',
        { code: error.code },
        requestId,
        'API:tasks'
      )
    }

    // 5. Return success
    logger.info('Task created successfully', {
      context: 'API:tasks',
      requestId,
      taskId: data.id,
    })

    return apiSuccess(data, 201, requestId)
  } catch (error) {
    logger.error('Unhandled error', {
      context: 'API:tasks',
      requestId,
      error: error as Error,
    })

    return ApiErrors.internalError(undefined, requestId)
  }
}
```

## HTTP Status Codes

Use the `HttpStatus` constants:

```typescript
import { HttpStatus } from '@/lib/api/response'

// Success
HttpStatus.OK // 200
HttpStatus.CREATED // 201
HttpStatus.NO_CONTENT // 204

// Client Errors
HttpStatus.BAD_REQUEST // 400
HttpStatus.UNAUTHORIZED // 401
HttpStatus.FORBIDDEN // 403
HttpStatus.NOT_FOUND // 404
HttpStatus.METHOD_NOT_ALLOWED // 405
HttpStatus.CONFLICT // 409
HttpStatus.UNPROCESSABLE_ENTITY // 422
HttpStatus.TOO_MANY_REQUESTS // 429

// Server Errors
HttpStatus.INTERNAL_SERVER_ERROR // 500
HttpStatus.SERVICE_UNAVAILABLE // 503
```

## Request ID Tracing

Every request generates a unique ID for tracing:

```typescript
const requestId = logger.generateRequestId()
// Format: req_1705315800000_abc123xyz

// Include in all logs
logger.info('Processing request', {
  context: 'API:tasks',
  requestId,
  userId,
})

// Include in response
return apiSuccess(data, 200, requestId)

// Client receives in metadata
{
  "success": true,
  "data": { ... },
  "metadata": {
    "requestId": "req_1705315800000_abc123"
  }
}
```

## Error Handling Patterns

### 1. Authentication Errors

```typescript
const { userId } = await auth()

if (!userId) {
  return ApiErrors.unauthorized(requestId)
}
```

### 2. Validation Errors

```typescript
const validation = validateInput(schema, body, requestId)

if (!validation.success) {
  return validation.response // Includes validation details
}
```

### 3. Database Errors

```typescript
const { data, error } = await supabase.from('tasks').select()

if (error) {
  // Log with context
  logger.error('Database query failed', {
    context: 'API:tasks',
    requestId,
    error: error.message,
    code: error.code,
  })

  // Return user-friendly error
  return apiError(
    'Failed to fetch tasks',
    500,
    'DATABASE_ERROR',
    { code: error.code },
    requestId,
    'API:tasks'
  )
}
```

### 4. External API Errors

```typescript
try {
  const response = await fetch('https://api.external.com/data')

  if (!response.ok) {
    return apiError(
      'External API request failed',
      response.status,
      'EXTERNAL_API_ERROR',
      { service: 'external', status: response.status },
      requestId,
      'API:tasks'
    )
  }
} catch (error) {
  return ApiErrors.serviceUnavailable('External API', requestId)
}
```

### 5. Resource Not Found

```typescript
const { data, error } = await supabase
  .from('tasks')
  .select()
  .eq('id', id)
  .single()

if (error?.code === 'PGRST116') {
  return ApiErrors.notFound('Task', requestId)
}
```

## Pagination Pattern

```typescript
export async function GET(request: NextRequest) {
  const requestId = logger.generateRequestId()

  try {
    const { userId } = await auth()
    if (!userId) return ApiErrors.unauthorized(requestId)

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const supabase = await SupabaseClients.authenticated()

    const { data, error, count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)

    if (error) {
      return apiError(
        error.message,
        500,
        'DATABASE_ERROR',
        undefined,
        requestId
      )
    }

    return apiSuccess(
      {
        items: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      },
      200,
      requestId
    )
  } catch (error) {
    return ApiErrors.internalError(undefined, requestId)
  }
}
```

## Filtering and Search Pattern

```typescript
export async function GET(request: NextRequest) {
  const requestId = logger.generateRequestId()

  try {
    const { userId } = await auth()
    if (!userId) return ApiErrors.unauthorized(requestId)

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    const supabase = await SupabaseClients.authenticated()

    let query = supabase.from('tasks').select('*').eq('user_id', userId)

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: order === 'asc' })

    const { data, error } = await query

    if (error) {
      return apiError(
        error.message,
        500,
        'DATABASE_ERROR',
        undefined,
        requestId
      )
    }

    return apiSuccess(data || [], 200, requestId)
  } catch (error) {
    return ApiErrors.internalError(undefined, requestId)
  }
}
```

## CORS Configuration

For public APIs:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  const response = apiSuccess(data, 200, requestId)

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')

  return response
}
```

## Rate Limiting

Using Upstash Rate Limit (optional):

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function POST(request: NextRequest) {
  const requestId = logger.generateRequestId()

  // Apply rate limiting
  const identifier = request.ip ?? 'anonymous'
  const { success, remaining, reset } = await ratelimit.limit(identifier)

  if (!success) {
    const retryAfter = Math.floor((reset - Date.now()) / 1000)
    return ApiErrors.rateLimited(retryAfter, requestId)
  }

  // Continue with request handling...
}
```

## Logging Best Practices

```typescript
// Request start
logger.info('Request received', {
  context: 'API:tasks',
  requestId,
  method: request.method,
  url: request.url,
})

// Operation details
logger.info('Creating task', {
  context: 'API:tasks:create',
  requestId,
  userId,
  title: data.title,
})

// Errors
logger.error('Failed to create task', {
  context: 'API:tasks:create',
  requestId,
  userId,
  error: error.message,
  code: error.code,
})

// Success
logger.info('Task created successfully', {
  context: 'API:tasks:create',
  requestId,
  userId,
  taskId: data.id,
})
```

## Client-Side Usage

```typescript
// React component
async function createTask(data: { name: string }) {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!result.success) {
    // Handle error
    console.error('Error:', result.error)
    toast.error(result.error)
    return null
  }

  // Handle success
  console.log('Created:', result.data)
  toast.success('Task created')
  return result.data
}
```

## Testing

```typescript
// API route test
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/tasks', () => {
  it('should create task', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Task' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id')
    expect(data.metadata).toHaveProperty('requestId')
  })

  it('should return validation error', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})
```

## Summary

1. **Use standardized response format** - Always return `{ success, data, metadata }`
2. **Generate request IDs** - For tracing and debugging
3. **Validate input** - Use Zod schemas and `validateInput()`
4. **Handle errors gracefully** - Return user-friendly messages
5. **Log all operations** - Include context and requestId
6. **Use proper status codes** - 200, 201, 400, 404, 500, etc.
7. **Document your APIs** - OpenAPI/Swagger specs
8. **Test thoroughly** - Unit and integration tests
