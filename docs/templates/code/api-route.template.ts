/**
 * Standardized API Route Template
 * ============================================================================
 * Next.js 15 App Router API route with:
 * - Request ID generation for tracing
 * - Standardized response format
 * - Error handling
 * - Enhanced logging
 * - Authentication check
 * - Input validation with Zod
 *
 * File location: src/app/api/{{route-name}}/route.ts
 *
 * Prerequisites:
 * - Standardized response utilities (src/lib/api/response.ts)
 * - Enhanced logger (src/lib/utils/logger-enhanced.ts)
 * - Supabase client factory (src/lib/supabase/factory.ts)
 * - Clerk authentication (@clerk/nextjs)
 */

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

// ============================================================================
// Request/Response Schemas
// ============================================================================

// Define request validation schema
const RequestSchema = z.object({
  // Add your request parameters here
  param1: z.string().min(1, 'Parameter 1 is required'),
  param2: z.number().optional(),
  // Example nested object
  metadata: z
    .object({
      source: z.string().optional(),
      timestamp: z.string().datetime().optional(),
    })
    .optional(),
})

type RequestBody = z.infer<typeof RequestSchema>

// Define response type
interface ResponseData {
  id: string
  result: string
  // Add your response fields here
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const requestId = logger.generateRequestId()

  try {
    // Log request
    logger.info('GET request received', {
      context: 'API:{{route-name}}',
      requestId,
      url: request.url,
    })

    // ========================================================================
    // Authentication (Optional - Remove if public endpoint)
    // ========================================================================

    const { userId } = await auth()

    if (!userId) {
      return ApiErrors.unauthorized(requestId)
    }

    // ========================================================================
    // Get Query Parameters
    // ========================================================================

    const searchParams = request.nextUrl.searchParams
    const param = searchParams.get('param')

    if (!param) {
      return apiError(
        'Missing required query parameter: param',
        400,
        'MISSING_PARAMETER',
        undefined,
        requestId,
        'API:{{route-name}}'
      )
    }

    // ========================================================================
    // Database Query
    // ========================================================================

    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('{{table_name}}')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return apiError(
        error.message,
        500,
        'DATABASE_ERROR',
        { code: error.code },
        requestId,
        'API:{{route-name}}'
      )
    }

    if (!data) {
      return ApiErrors.notFound('Resource', requestId)
    }

    // ========================================================================
    // Return Success Response
    // ========================================================================

    const response: ResponseData = {
      id: data.id,
      result: 'success',
    }

    logger.info('GET request completed successfully', {
      context: 'API:{{route-name}}',
      requestId,
      userId,
    })

    return apiSuccess(response, 200, requestId)
  } catch (error) {
    logger.error('Unhandled error in GET handler', {
      context: 'API:{{route-name}}',
      requestId,
      error: error as Error,
    })

    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR',
      undefined,
      requestId,
      'API:{{route-name}}'
    )
  }
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const requestId = logger.generateRequestId()

  try {
    logger.info('POST request received', {
      context: 'API:{{route-name}}',
      requestId,
    })

    // ========================================================================
    // Authentication
    // ========================================================================

    const { userId } = await auth()

    if (!userId) {
      return ApiErrors.unauthorized(requestId)
    }

    // ========================================================================
    // Parse and Validate Request Body
    // ========================================================================

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError(
        'Invalid JSON in request body',
        400,
        'INVALID_JSON',
        undefined,
        requestId,
        'API:{{route-name}}'
      )
    }

    // Validate with Zod
    const validation = validateInput(RequestSchema, body, requestId)

    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // ========================================================================
    // Business Logic
    // ========================================================================

    logger.info('Processing request', {
      context: 'API:{{route-name}}',
      requestId,
      userId,
      param1: validatedData.param1,
    })

    // Example: Database operation
    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('{{table_name}}')
      .insert([
        {
          user_id: userId,
          value: validatedData.param1,
          created_at: new Date().toISOString(),
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
        'API:{{route-name}}'
      )
    }

    // ========================================================================
    // Return Success Response
    // ========================================================================

    const response: ResponseData = {
      id: data.id,
      result: 'created',
    }

    logger.info('POST request completed successfully', {
      context: 'API:{{route-name}}',
      requestId,
      userId,
      resourceId: data.id,
    })

    return apiSuccess(response, 201, requestId)
  } catch (error) {
    logger.error('Unhandled error in POST handler', {
      context: 'API:{{route-name}}',
      requestId,
      error: error as Error,
    })

    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR',
      undefined,
      requestId,
      'API:{{route-name}}'
    )
  }
}

// ============================================================================
// PUT/PATCH Handler (Optional)
// ============================================================================

export async function PATCH(request: NextRequest) {
  const requestId = logger.generateRequestId()

  try {
    const { userId } = await auth()

    if (!userId) {
      return ApiErrors.unauthorized(requestId)
    }

    // Parse body
    const body = await request.json()

    // Partial validation for updates
    const UpdateSchema = RequestSchema.partial()
    const validation = validateInput(UpdateSchema, body, requestId)

    if (!validation.success) {
      return validation.response
    }

    const validatedData = validation.data

    // Update logic here
    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('{{table_name}}')
      .update(validatedData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return apiError(
        error.message,
        500,
        'DATABASE_ERROR',
        { code: error.code },
        requestId,
        'API:{{route-name}}'
      )
    }

    return apiSuccess(data, 200, requestId)
  } catch (error) {
    logger.error('Unhandled error in PATCH handler', {
      context: 'API:{{route-name}}',
      requestId,
      error: error as Error,
    })

    return apiError(
      'Internal server error',
      500,
      'INTERNAL_ERROR',
      undefined,
      requestId,
      'API:{{route-name}}'
    )
  }
}

// ============================================================================
// DELETE Handler (Optional)
// ============================================================================

export async function DELETE(request: NextRequest) {
  const requestId = logger.generateRequestId()

  try {
    const { userId } = await auth()

    if (!userId) {
      return ApiErrors.unauthorized(requestId)
    }

    // Get ID from query params
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return apiError(
        'Missing required parameter: id',
        400,
        'MISSING_PARAMETER',
        undefined,
        requestId,
        'API:{{route-name}}'
      )
    }

    // Delete logic
    const supabase = await SupabaseClients.authenticated()

    const { error } = await supabase
      .from('{{table_name}}')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns the resource

    if (error) {
      return apiError(
        error.message,
        500,
        'DATABASE_ERROR',
        { code: error.code },
        requestId,
        'API:{{route-name}}'
      )
    }

    return apiSuccess({ deleted: true }, 200, requestId)
  } catch (error) {
    logger.error('Unhandled error in DELETE handler', {
      context: 'API:{{route-name}}',
      requestId,
      error: error as Error,
    })

    return apiError(
      'Internal server error',
      500,
      'INTERNAL_ERROR',
      undefined,
      requestId,
      'API:{{route-name}}'
    )
  }
}

/**
 * USAGE NOTES:
 *
 * 1. Replace {{route-name}} with your actual route name
 * 2. Replace {{table_name}} with your Supabase table name
 * 3. Update RequestSchema with your actual parameters
 * 4. Implement your business logic in each handler
 * 5. Add appropriate error handling for your use case
 *
 * 6. Response Format:
 *    Success: { success: true, data: {...}, metadata: { timestamp, requestId } }
 *    Error: { success: false, error: "message", code: "ERROR_CODE", metadata: {...} }
 *
 * 7. Authentication:
 *    - Remove auth check for public endpoints
 *    - Use SupabaseClients.public() for public data access
 *    - Use SupabaseClients.authenticated() for user-specific operations
 *    - Use SupabaseClients.admin() only for admin operations (webhooks, system tasks)
 *
 * 8. Logging:
 *    - All logs include context and requestId for tracing
 *    - Use appropriate log levels (info, warn, error)
 *    - Include relevant data but avoid logging sensitive information
 *
 * 9. Rate Limiting (Optional):
 *    - Consider adding rate limiting for public endpoints
 *    - Use Upstash Rate Limit or similar service
 *
 * 10. CORS (Optional):
 *     - Add CORS headers if API is accessed from external domains
 *     - Configure in next.config.ts or per-route
 */
