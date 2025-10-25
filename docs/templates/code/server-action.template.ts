/**
 * Standardized Server Action Template
 * ============================================================================
 * Next.js 15 Server Action with:
 * - Type-safe input validation (Zod)
 * - Standardized error handling
 * - Enhanced logging
 * - Authentication
 * - Database operations with Supabase
 *
 * File location: src/lib/actions/{{action-name}}.ts
 *
 * Prerequisites:
 * - Zod for validation
 * - Enhanced logger (src/lib/utils/logger-enhanced.ts)
 * - Supabase client factory (src/lib/supabase/factory.ts)
 * - Clerk authentication (@clerk/nextjs)
 *
 * Usage in components:
 * import { myServerAction } from '@/lib/actions/{{action-name}}'
 * const result = await myServerAction(data)
 */

'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { SupabaseClients } from '@/lib/supabase/factory'
import { logger } from '@/lib/utils/logger-enhanced'
import type { Database } from '@/lib/types/database'

// ============================================================================
// Type Definitions
// ============================================================================

// Standardized result type for server actions
export interface ActionResult<T> {
  success: boolean
  data: T | null
  error: string | null
}

// Database types
type Tables = Database['public']['Tables']
type {{ResourceName}} = Tables['{{table_name}}']['Row']
type {{ResourceName}}Insert = Tables['{{table_name}}']['Insert']
type {{ResourceName}}Update = Tables['{{table_name}}']['Update']

// ============================================================================
// Validation Schemas
// ============================================================================

// Input validation schema
const CreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  metadata: z
    .object({
      tags: z.array(z.string()).optional(),
      priority: z.number().min(1).max(5).optional(),
    })
    .optional(),
})

const UpdateSchema = CreateSchema.partial().extend({
  id: z.string().uuid('Invalid ID format'),
})

// Export types for use in components
export type CreateInput = z.infer<typeof CreateSchema>
export type UpdateInput = z.infer<typeof UpdateSchema>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get or create user profile (adjust based on your schema)
 */
async function ensureUserProfile(userId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (error) {
      return {
        success: false,
        data: null,
        error: `Failed to fetch profile: ${error.message}`,
      }
    }

    if (!data) {
      return {
        success: false,
        data: null,
        error: 'Profile not found',
      }
    }

    return { success: true, data: { id: data.id }, error: null }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Profile check failed: ${error}`,
    }
  }
}

// ============================================================================
// CREATE Action
// ============================================================================

/**
 * Create a new resource
 *
 * @param input - Resource data to create
 * @returns ActionResult with created resource or error
 *
 * @example
 * const result = await create{{ResourceName}}({
 *   name: 'Example',
 *   description: 'Example description',
 *   status: 'active'
 * })
 *
 * if (result.success) {
 *   console.log('Created:', result.data)
 * } else {
 *   console.error('Error:', result.error)
 * }
 */
export async function create{{ResourceName}}(
  input: CreateInput
): Promise<ActionResult<{{ResourceName}}>> {
  try {
    // ========================================================================
    // Authentication
    // ========================================================================

    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        data: null,
        error: 'Not authenticated',
      }
    }

    // ========================================================================
    // Input Validation
    // ========================================================================

    let validatedData: CreateInput
    try {
      validatedData = CreateSchema.parse(input)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((issue) => issue.message).join(', ')
        return {
          success: false,
          data: null,
          error: `Validation failed: ${errorMessages}`,
        }
      }
      throw error
    }

    logger.info('Creating {{resource_name}}', {
      context: 'ServerAction:{{resource_name}}:create',
      userId,
      name: validatedData.name,
    })

    // ========================================================================
    // Ensure User Profile Exists
    // ========================================================================

    const profileResult = await ensureUserProfile(userId)

    if (!profileResult.success) {
      return {
        success: false,
        data: null,
        error: profileResult.error,
      }
    }

    // ========================================================================
    // Database Operation
    // ========================================================================

    const supabase = await SupabaseClients.authenticated()

    const insertData: {{ResourceName}}Insert = {
      ...validatedData,
      user_id: profileResult.data.id,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('{{table_name}}')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      logger.error('Failed to create {{resource_name}}', {
        context: 'ServerAction:{{resource_name}}:create',
        userId,
        error: error.message,
        code: error.code,
      })

      return {
        success: false,
        data: null,
        error: `Failed to create {{resource_name}}: ${error.message}`,
      }
    }

    logger.info('{{ResourceName}} created successfully', {
      context: 'ServerAction:{{resource_name}}:create',
      userId,
      resourceId: data.id,
    })

    return {
      success: true,
      data,
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error in create{{ResourceName}}', {
      context: 'ServerAction:{{resource_name}}:create',
      error: error as Error,
    })

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
    }
  }
}

// ============================================================================
// READ Action (Single)
// ============================================================================

/**
 * Get a single resource by ID
 */
export async function get{{ResourceName}}(id: string): Promise<ActionResult<{{ResourceName}}>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        data: null,
        error: 'Not authenticated',
      }
    }

    // Validate ID format
    const idSchema = z.string().uuid()
    const validation = idSchema.safeParse(id)

    if (!validation.success) {
      return {
        success: false,
        data: null,
        error: 'Invalid ID format',
      }
    }

    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('{{table_name}}')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          data: null,
          error: '{{ResourceName}} not found',
        }
      }

      return {
        success: false,
        data: null,
        error: `Failed to fetch {{resource_name}}: ${error.message}`,
      }
    }

    return {
      success: true,
      data,
      error: null,
    }
  } catch (error) {
    logger.error('Error in get{{ResourceName}}', {
      context: 'ServerAction:{{resource_name}}:get',
      error: error as Error,
      id,
    })

    return {
      success: false,
      data: null,
      error: 'Failed to fetch {{resource_name}}',
    }
  }
}

// ============================================================================
// READ Action (List)
// ============================================================================

/**
 * Get all resources for the current user
 */
export async function list{{ResourceName}}s(): Promise<ActionResult<{{ResourceName}}[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        data: null,
        error: 'Not authenticated',
      }
    }

    const profileResult = await ensureUserProfile(userId)

    if (!profileResult.success) {
      return {
        success: false,
        data: null,
        error: profileResult.error,
      }
    }

    const supabase = await SupabaseClients.authenticated()

    const { data, error } = await supabase
      .from('{{table_name}}')
      .select('*')
      .eq('user_id', profileResult.data.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to list {{resource_name}}s', {
        context: 'ServerAction:{{resource_name}}:list',
        userId,
        error: error.message,
      })

      return {
        success: false,
        data: null,
        error: `Failed to fetch {{resource_name}}s: ${error.message}`,
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (error) {
    logger.error('Error in list{{ResourceName}}s', {
      context: 'ServerAction:{{resource_name}}:list',
      error: error as Error,
    })

    return {
      success: false,
      data: null,
      error: 'Failed to fetch {{resource_name}}s',
    }
  }
}

// ============================================================================
// UPDATE Action
// ============================================================================

/**
 * Update an existing resource
 */
export async function update{{ResourceName}}(
  input: UpdateInput
): Promise<ActionResult<{{ResourceName}}>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        data: null,
        error: 'Not authenticated',
      }
    }

    // Validate input
    let validatedData: UpdateInput
    try {
      validatedData = UpdateSchema.parse(input)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((issue) => issue.message).join(', ')
        return {
          success: false,
          data: null,
          error: `Validation failed: ${errorMessages}`,
        }
      }
      throw error
    }

    logger.info('Updating {{resource_name}}', {
      context: 'ServerAction:{{resource_name}}:update',
      userId,
      resourceId: validatedData.id,
    })

    const supabase = await SupabaseClients.authenticated()

    // Extract ID and update data
    const { id, ...updateData } = validatedData

    const { data, error } = await supabase
      .from('{{table_name}}')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update {{resource_name}}', {
        context: 'ServerAction:{{resource_name}}:update',
        userId,
        resourceId: id,
        error: error.message,
      })

      return {
        success: false,
        data: null,
        error: `Failed to update {{resource_name}}: ${error.message}`,
      }
    }

    logger.info('{{ResourceName}} updated successfully', {
      context: 'ServerAction:{{resource_name}}:update',
      userId,
      resourceId: id,
    })

    return {
      success: true,
      data,
      error: null,
    }
  } catch (error) {
    logger.error('Error in update{{ResourceName}}', {
      context: 'ServerAction:{{resource_name}}:update',
      error: error as Error,
    })

    return {
      success: false,
      data: null,
      error: 'Failed to update {{resource_name}}',
    }
  }
}

// ============================================================================
// DELETE Action
// ============================================================================

/**
 * Delete a resource
 */
export async function delete{{ResourceName}}(id: string): Promise<ActionResult<boolean>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        data: null,
        error: 'Not authenticated',
      }
    }

    // Validate ID
    const idSchema = z.string().uuid()
    const validation = idSchema.safeParse(id)

    if (!validation.success) {
      return {
        success: false,
        data: null,
        error: 'Invalid ID format',
      }
    }

    logger.info('Deleting {{resource_name}}', {
      context: 'ServerAction:{{resource_name}}:delete',
      userId,
      resourceId: id,
    })

    const supabase = await SupabaseClients.authenticated()

    const { error } = await supabase.from('{{table_name}}').delete().eq('id', id)

    if (error) {
      logger.error('Failed to delete {{resource_name}}', {
        context: 'ServerAction:{{resource_name}}:delete',
        userId,
        resourceId: id,
        error: error.message,
      })

      return {
        success: false,
        data: null,
        error: `Failed to delete {{resource_name}}: ${error.message}`,
      }
    }

    logger.info('{{ResourceName}} deleted successfully', {
      context: 'ServerAction:{{resource_name}}:delete',
      userId,
      resourceId: id,
    })

    return {
      success: true,
      data: true,
      error: null,
    }
  } catch (error) {
    logger.error('Error in delete{{ResourceName}}', {
      context: 'ServerAction:{{resource_name}}:delete',
      error: error as Error,
    })

    return {
      success: false,
      data: null,
      error: 'Failed to delete {{resource_name}}',
    }
  }
}

/**
 * USAGE NOTES:
 *
 * 1. Replace all {{placeholders}}:
 *    - {{ResourceName}}: PascalCase (e.g., Task, Project, Note)
 *    - {{resource_name}}: lowercase (e.g., task, project, note)
 *    - {{table_name}}: Supabase table name (e.g., tasks, projects, notes)
 *
 * 2. In React Components:
 *    import { create{{ResourceName}}, list{{ResourceName}}s } from '@/lib/actions/{{action-name}}'
 *
 *    const handleCreate = async () => {
 *      const result = await create{{ResourceName}}(formData)
 *      if (result.success) {
 *        // Handle success
 *      } else {
 *        // Handle error: result.error
 *      }
 *    }
 *
 * 3. Error Handling:
 *    - Always check result.success before accessing result.data
 *    - Display result.error to user when success is false
 *    - Use toast notifications for user feedback
 *
 * 4. Loading States:
 *    - Use React.useTransition() for loading states
 *    - const [isPending, startTransition] = useTransition()
 *    - startTransition(() => { handleCreate() })
 *
 * 5. Validation:
 *    - Validate on both client and server
 *    - Use the same Zod schemas for consistency
 *    - Export schemas for use in forms
 *
 * 6. Database Client Selection:
 *    - authenticated(): For user-specific operations (default)
 *    - admin(): Only for admin operations that bypass RLS
 *    - public(): For public data access
 */
