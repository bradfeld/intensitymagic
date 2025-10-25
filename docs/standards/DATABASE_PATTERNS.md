# Database Patterns with Supabase

Standard patterns for database access using the Supabase client factory.

## Overview

All database access uses the `SupabaseClients` factory pattern for consistent, type-safe database operations with proper authentication and Row Level Security (RLS).

## Client Factory Pattern

### Factory Methods

```typescript
// User operations (respects RLS)
const supabase = await SupabaseClients.authenticated()

// Admin operations (bypasses RLS)
const supabase = SupabaseClients.admin()

// Public data access
const supabase = await SupabaseClients.public()

// Client-side operations (singleton)
const supabase = SupabaseClients.browser()
```

### Decision Tree

```
┌─────────────────────────────────────────────────┐
│ Which Supabase Client Should I Use?            │
└─────────────────────────────────────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │ Is it server or │
            │  client side?   │
            └─────────────────┘
               │           │
        Server │           │ Client
               ▼           ▼
    ┌────────────────┐  ┌──────────┐
    │ Does it need   │  │ browser()│
    │ auth context?  │  └──────────┘
    └────────────────┘
       │           │
    Yes│           │No
       ▼           ▼
┌──────────────┐ ┌─────────┐
│authenticated()│ │public() │
└──────────────┘ └─────────┘
       │
       ▼
┌────────────────┐
│ Is it for      │
│ system/admin?  │
└────────────────┘
       │
    Yes│
       ▼
┌──────────┐
│ admin()  │
└──────────┘
```

**When to use each:**

- **`authenticated()`** - Default for user operations
  - Profile CRUD
  - User-specific queries
  - Any operation tied to logged-in user

- **`admin()`** - System operations only
  - Webhooks (user sync)
  - Admin endpoints
  - System maintenance tasks
  - Bypasses RLS policies

- **`public()`** - Public pages
  - Health checks
  - Public data queries
  - Non-authenticated pages

- **`browser()`** - Client components
  - React components
  - Client-side data fetching
  - Real-time subscriptions

## Common Patterns

### 1. Create Operation

```typescript
'use server'

import { SupabaseClients } from '@/lib/supabase/factory'
import { auth } from '@clerk/nextjs/server'

export async function createTask(data: {
  title: string
  description?: string
}) {
  // Get user ID
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Use authenticated client
  const supabase = await SupabaseClients.authenticated()

  // Insert with user context
  const { data: task, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: userId,
        title: data.title,
        description: data.description,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: task }
}
```

### 2. Read Operations

#### Single Record

```typescript
export async function getTask(id: string) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await SupabaseClients.authenticated()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns the task
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Task not found' }
    }
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
```

#### List with Pagination

```typescript
export async function listTasks(params: {
  page?: number
  limit?: number
  search?: string
}) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const page = params.page ?? 1
  const limit = params.limit ?? 10
  const offset = (page - 1) * limit

  const supabase = await SupabaseClients.authenticated()

  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Apply search filter
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  }
}
```

### 3. Update Operation

```typescript
export async function updateTask(
  id: string,
  updates: { title?: string; description?: string; completed?: boolean }
) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await SupabaseClients.authenticated()

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId) // Security: only update own tasks
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: 'Task not found or unauthorized' }
  }

  return { success: true, data }
}
```

### 4. Delete Operation

```typescript
export async function deleteTask(id: string) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await SupabaseClients.authenticated()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId) // Security: only delete own tasks

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
```

### 5. Complex Queries

#### Join Operations

```typescript
export async function getTasksWithCategory() {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await SupabaseClients.authenticated()

  const { data, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      category:categories (
        id,
        name,
        color
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data || [] }
}
```

#### Aggregation

```typescript
export async function getTaskStats() {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await SupabaseClients.authenticated()

  // Get counts by status
  const { data, error } = await supabase
    .from('tasks')
    .select('completed')
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  const stats = {
    total: data.length,
    completed: data.filter(t => t.completed).length,
    pending: data.filter(t => !t.completed).length,
  }

  return { success: true, data: stats }
}
```

### 6. Upsert Pattern

```typescript
export async function savePreferences(preferences: {
  theme?: string
  notifications?: boolean
}) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await SupabaseClients.authenticated()

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert([
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
```

### 7. Admin Operations

```typescript
// Webhook handler - uses admin client
export async function POST(request: Request) {
  // Verify webhook signature
  // ...

  const { userId, email } = await request.json()

  // Use admin client to bypass RLS
  const supabase = SupabaseClients.admin()

  const { data, error } = await supabase
    .from('profiles')
    .upsert([
      {
        clerk_user_id: userId,
        email,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, data })
}
```

### 8. Real-Time Subscriptions (Client-Side)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { SupabaseClients } from '@/lib/supabase/factory'

export function TaskList() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    const supabase = SupabaseClients.browser()

    // Initial fetch
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setTasks(data)
    }

    fetchTasks()

    // Subscribe to changes
    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task =>
            task.id === payload.new.id ? payload.new : task
          ))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

## Row Level Security (RLS)

### Basic RLS Policies

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### Advanced RLS Patterns

```sql
-- Public read, authenticated write
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Shared access
CREATE POLICY "Users can view shared tasks"
  ON tasks FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM task_shares WHERE task_id = tasks.id
    )
  );
```

## Type Safety

### Generate Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.ts
```

### Use Generated Types

```typescript
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Task = Tables['tasks']['Row']
type TaskInsert = Tables['tasks']['Insert']
type TaskUpdate = Tables['tasks']['Update']

// Type-safe insert
const newTask: TaskInsert = {
  user_id: userId,
  title: 'New Task',
  completed: false,
}
```

## Error Handling

### Standard Pattern

```typescript
const { data, error } = await supabase.from('tasks').select('*')

if (error) {
  logger.error('Failed to fetch tasks', {
    context: 'ServerAction:tasks:list',
    error: error.message,
    code: error.code,
  })

  // Return user-friendly error
  return {
    success: false,
    error: 'Failed to fetch tasks. Please try again.',
  }
}

return { success: true, data: data || [] }
```

### Common Error Codes

- `23505` - Unique constraint violation
- `23503` - Foreign key violation
- `PGRST116` - Resource not found (404)
- `42P01` - Table does not exist
- `42501` - Insufficient privileges (RLS)

## Best Practices

1. **Always use the factory pattern** - Never create clients directly
2. **Prefer authenticated() over admin()** - Only use admin for system operations
3. **Always check authentication** - Verify `userId` before database operations
4. **Use RLS policies** - Let database enforce security
5. **Type-safe queries** - Use generated TypeScript types
6. **Handle errors gracefully** - Return user-friendly messages
7. **Log operations** - Use enhanced logger with context
8. **Use transactions** - For multi-table operations
9. **Optimize queries** - Use select(), limit(), and indexes
10. **Test RLS policies** - Verify security with different users

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
