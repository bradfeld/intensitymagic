# Enhanced Logger Usage Guide

Comprehensive guide for using the enhanced logger with structured, environment-aware logging.

## Overview

The enhanced logger (`src/lib/utils/logger-enhanced.ts`) provides:

- Environment-aware output (dev: human-readable, prod: JSON)
- Request ID generation and tracing
- Context prefixes for categorization
- PII sanitization
- Multiple log levels with appropriate console methods

## Basic Usage

```typescript
import { logger } from '@/lib/utils/logger-enhanced'

// Info logging
logger.info('User logged in', {
  context: 'Auth:Login',
  userId: '123',
})

// Warning logging
logger.warn('Rate limit approaching', {
  context: 'API:RateLimit',
  remaining: 10,
  limit: 100,
})

// Error logging
logger.error('Database connection failed', {
  context: 'Database:Connection',
  error: error as Error, // Always cast to Error
  retryCount: 3,
})

// Debug logging (only shown if LOG_LEVEL=debug)
logger.debug('Cache hit', {
  context: 'Cache:Get',
  key: 'user:123',
  ttl: 3600,
})
```

## Log Levels

```typescript
// Set in environment variables
LOG_LEVEL = debug // Shows all logs
LOG_LEVEL = info // Shows info, warn, error (default)
LOG_LEVEL = warn // Shows warn, error only
LOG_LEVEL = error // Shows error only

// Usage
logger.debug('Detailed info') // Only if LOG_LEVEL=debug
logger.info('General info') // Default
logger.warn('Warning message')
logger.error('Error occurred')
```

## Context Prefixes

Use consistent context prefixes to categorize logs:

### Standard Prefixes

```typescript
// Authentication
logger.info('User authenticated', {
  context: 'Auth:Login',
  userId,
})

logger.error('Authentication failed', {
  context: 'Auth:Webhook',
  error: error as Error,
})

// Services
logger.info('Provider search completed', {
  context: 'Services:Provider',
  resultCount: results.length,
})

logger.warn('Cache miss', {
  context: 'Services:Cache',
  key,
})

// Profile operations
logger.info('Profile updated', {
  context: 'Profile:BasicInfo',
  userId,
  fields: ['email', 'phone'],
})

logger.error('Profile creation failed', {
  context: 'Profile:Create',
  error: error as Error,
  userId,
})

// API routes
logger.info('API request received', {
  context: 'API:Tasks',
  requestId,
  method: 'POST',
})

logger.error('API error', {
  context: 'API:Medications',
  error: error as Error,
  requestId,
})

// Pages
logger.info('Page rendered', {
  context: 'Pages:Home',
  userId,
  renderTime: 150,
})

logger.warn('Slow page load', {
  context: 'Pages:Recommendations',
  loadTime: 3000,
})

// Recommendations
logger.info('Recommendations generated', {
  context: 'Recommendations:Generate',
  userId,
  planCount: 5,
})

logger.error('OpenAI request failed', {
  context: 'Recommendations:OpenAI',
  error: error as Error,
  retryCount: 2,
})
```

### Context Naming Convention

```
Category:Subcategory:Action

Examples:
Auth:Login:Verify
Services:Provider:Search
API:Tasks:Create
Database:Connection:Retry
Cache:User:Invalidate
```

## Request ID Tracing

Generate and use request IDs for tracing:

```typescript
// Generate ID
const requestId = logger.generateRequestId()
// Format: req_1705315800000_abc123xyz

// Include in all logs
logger.info('Processing request', {
  context: 'API:Tasks',
  requestId,
  userId,
})

logger.error('Request failed', {
  context: 'API:Tasks',
  requestId,
  error: error as Error,
})

// Pass through function calls
async function createTask(data: TaskData, requestId: string) {
  logger.info('Creating task', {
    context: 'Services:Task:Create',
    requestId,
    taskName: data.name,
  })

  // ...
}
```

## Error Logging

### Critical Pattern: Always Cast Errors

```typescript
// ❌ WRONG - TypeScript error
logger.error('Operation failed', {
  context: 'API:Tasks',
  error: error, // Type error!
})

// ✅ CORRECT - Cast to Error
logger.error('Operation failed', {
  context: 'API:Tasks',
  error: error as Error,
})
```

### Error Logging Patterns

```typescript
// Caught exception
try {
  await riskyOperation()
} catch (error) {
  logger.error('Risky operation failed', {
    context: 'Services:Risk',
    error: error as Error,
    input: sanitizedInput,
  })
  throw error
}

// Database error
const { data, error } = await supabase.from('tasks').select()

if (error) {
  logger.error('Database query failed', {
    context: 'Database:Tasks:Query',
    error: error.message, // Already a string
    code: error.code,
    table: 'tasks',
  })
}

// External API error
const response = await fetch(url)

if (!response.ok) {
  logger.error('External API request failed', {
    context: 'API:External:Fetch',
    error: `HTTP ${response.status}: ${response.statusText}`,
    url,
    status: response.status,
  })
}
```

## Optional Properties Pattern

Due to `exactOptionalPropertyTypes`, handle optional properties carefully:

```typescript
// ❌ WRONG - undefined not assignable
const errorObj = {
  context: 'API:Tasks',
  error: maybeError || undefined, // Type error!
}

// ✅ CORRECT - Conditional assignment
const errorObj = { context: 'API:Tasks' }
if (maybeError) {
  Object.assign(errorObj, { error: maybeError as Error })
}
logger.error('Message', errorObj)

// ✅ CORRECT - Build incrementally
const logData: Record<string, unknown> = {
  context: 'API:Tasks',
  requestId,
}

if (error) {
  logData.error = error as Error
}

if (userId) {
  logData.userId = userId
}

logger.error('Request failed', logData)

// ✅ CORRECT - Spread pattern
logger.error('Request failed', {
  context: 'API:Tasks',
  requestId,
  ...(error && { error: error as Error }),
  ...(userId && { userId }),
})
```

## Specialized Logging Methods

### Analytics Events

```typescript
logger.analytics('user_signed_up', {
  context: 'Analytics:Auth',
  userId,
  source: 'google',
  timestamp: new Date().toISOString(),
})

logger.analytics('plan_selected', {
  context: 'Analytics:Recommendations',
  userId,
  planId,
  planName,
  premium: 125.5,
})
```

### Cache Operations

```typescript
logger.cache('cache_hit', {
  context: 'Cache:User',
  key: 'user:123',
  ttl: 3600,
})

logger.cache('cache_miss', {
  context: 'Cache:Plans',
  key: 'plans:zip:12345',
})

logger.cache('cache_invalidate', {
  context: 'Cache:Recommendations',
  pattern: 'rec:*',
  count: 15,
})
```

### Performance Metrics

```typescript
logger.performance('api_response_time', {
  context: 'Performance:API',
  endpoint: '/api/tasks',
  duration: 250, // ms
  status: 200,
})

logger.performance('database_query_time', {
  context: 'Performance:Database',
  table: 'tasks',
  operation: 'select',
  duration: 45,
  rowCount: 100,
})

logger.performance('page_load_time', {
  context: 'Performance:Pages',
  page: '/dashboard',
  duration: 1200,
  userId,
})
```

## Environment-Specific Output

### Development Output

```
[2025-01-15T10:30:45.123Z] [INFO][API:Tasks][req_123_abc] Processing request
{
  "userId": "user_abc123",
  "method": "POST",
  "taskCount": 5
}
```

### Production Output (JSON)

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Processing request",
  "context": "API:Tasks",
  "requestId": "req_123_abc",
  "data": {
    "userId": "user_abc123",
    "method": "POST",
    "taskCount": 5
  }
}
```

## PII Sanitization

The logger automatically sanitizes PII:

```typescript
// Email
logger.info('User created', {
  context: 'Auth:Register',
  email: 'john.doe@example.com', // Logged as: jo***@example.com
})

// Phone
logger.info('Profile updated', {
  context: 'Profile:Update',
  phone: '555-123-4567', // Logged as: 555***4567
})

// SSN
logger.info('Verification', {
  context: 'Verification:SSN',
  ssn: '123-45-6789', // Logged as: ***-**-****
})
```

## Common Patterns

### API Route Logging

```typescript
export async function POST(request: NextRequest) {
  const requestId = logger.generateRequestId()

  logger.info('API request received', {
    context: 'API:Tasks:POST',
    requestId,
    url: request.url,
  })

  try {
    const { userId } = await auth()

    if (!userId) {
      logger.warn('Unauthorized request', {
        context: 'API:Tasks:POST',
        requestId,
      })
      return ApiErrors.unauthorized(requestId)
    }

    logger.info('Creating task', {
      context: 'API:Tasks:POST',
      requestId,
      userId,
    })

    // Business logic...

    logger.info('Task created successfully', {
      context: 'API:Tasks:POST',
      requestId,
      userId,
      taskId: data.id,
    })

    return apiSuccess(data, 201, requestId)
  } catch (error) {
    logger.error('Unhandled error', {
      context: 'API:Tasks:POST',
      requestId,
      error: error as Error,
    })
    return ApiErrors.internalError(undefined, requestId)
  }
}
```

### Server Action Logging

```typescript
'use server'

export async function createTask(input: CreateTaskInput) {
  try {
    const { userId } = await auth()

    if (!userId) {
      logger.warn('Unauthenticated action attempt', {
        context: 'ServerAction:Task:Create',
      })
      return { success: false, error: 'Not authenticated' }
    }

    logger.info('Creating task', {
      context: 'ServerAction:Task:Create',
      userId,
      taskName: input.name,
    })

    // Business logic...

    logger.info('Task created', {
      context: 'ServerAction:Task:Create',
      userId,
      taskId: data.id,
    })

    return { success: true, data }
  } catch (error) {
    logger.error('Task creation failed', {
      context: 'ServerAction:Task:Create',
      error: error as Error,
    })
    return { success: false, error: 'Failed to create task' }
  }
}
```

### External API Calls

```typescript
async function fetchExternalData(url: string, requestId: string) {
  logger.info('Calling external API', {
    context: 'Services:External:Fetch',
    requestId,
    url,
  })

  try {
    const response = await fetch(url, {
      headers: { 'X-Request-ID': requestId },
    })

    if (!response.ok) {
      logger.error('External API error', {
        context: 'Services:External:Fetch',
        requestId,
        status: response.status,
        statusText: response.statusText,
        url,
      })
      throw new Error(`HTTP ${response.status}`)
    }

    logger.info('External API success', {
      context: 'Services:External:Fetch',
      requestId,
      status: response.status,
    })

    return await response.json()
  } catch (error) {
    logger.error('External API call failed', {
      context: 'Services:External:Fetch',
      requestId,
      error: error as Error,
      url,
    })
    throw error
  }
}
```

### Database Operations

```typescript
async function getUserTasks(userId: string) {
  logger.info('Fetching user tasks', {
    context: 'Database:Tasks:Get',
    userId,
  })

  const supabase = await SupabaseClients.authenticated()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    logger.error('Database query failed', {
      context: 'Database:Tasks:Get',
      userId,
      error: error.message,
      code: error.code,
    })
    throw new Error('Failed to fetch tasks')
  }

  logger.info('Tasks fetched', {
    context: 'Database:Tasks:Get',
    userId,
    count: data.length,
  })

  return data
}
```

## Log Level Guidelines

### DEBUG

- Cache operations
- Detailed function execution
- Variable values
- Request/response bodies (non-sensitive)

### INFO

- Request received
- Operation started/completed
- Resource created/updated
- User actions
- Performance metrics

### WARN

- Rate limit approaching
- Deprecated feature used
- Fallback used
- Retry attempt
- Configuration missing (non-critical)

### ERROR

- Request failed
- Database error
- External API error
- Validation failure (unexpected)
- Resource not found (unexpected)
- Authentication failure

## Best Practices

1. **Always use context prefixes** - Makes logs searchable
2. **Include request IDs** - Essential for tracing
3. **Cast errors to Error type** - Required for TypeScript
4. **Don't log sensitive data** - Let sanitization handle it
5. **Use appropriate log levels** - Don't overuse error
6. **Be concise but descriptive** - Include relevant context
7. **Log at decision points** - Entry, exit, branching
8. **Avoid logging in loops** - Unless debugging
9. **Use structured data** - Not string concatenation
10. **Never use console.log** - Use logger methods

## Querying Logs

### Vercel Dashboard

```
# Search by context
context:"API:Tasks"

# Search by request ID
requestId:"req_1705315800000_abc123xyz"

# Search by level
level:error

# Search by user
userId:"user_abc123"

# Combined search
context:"API:Tasks" AND level:error AND userId:"user_abc123"
```

### Local Development

```bash
# Filter by context
npm run dev | grep "API:Tasks"

# Filter by level
npm run dev | grep "ERROR"

# Filter by request ID
npm run dev | grep "req_123_abc"
```

## Additional Resources

- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging-guide)
- [Log Levels Guide](https://www.loggly.com/ultimate-guide/logging-levels/)
- [Vercel Logs Documentation](https://vercel.com/docs/observability/runtime-logs)
