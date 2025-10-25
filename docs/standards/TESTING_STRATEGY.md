# Testing Strategy

**Comprehensive testing approach for Next.js 15 + Vercel + Supabase + Clerk applications**

Based on production patterns from MedicareMagic and AuthorMagic.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Stack](#testing-stack)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [API Testing](#api-testing)
7. [Database Testing](#database-testing)
8. [Authentication Testing](#authentication-testing)
9. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Testing Pyramid

```
        /\
       /  \      E2E Tests (few)
      /----\
     /      \    Integration Tests (some)
    /--------\
   /          \  Unit Tests (many)
  /------------\
```

### Key Principles

1. **Write tests that provide value** - Focus on critical paths
2. **Test behavior, not implementation** - Avoid brittle tests
3. **Keep tests fast** - Fast feedback loop
4. **Test in isolation** - Mock external dependencies
5. **Test edge cases** - Not just happy paths

---

## Testing Stack

### Core Tools

```json
{
  "dependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@playwright/test": "^1.40.0",
    "vitest": "^1.0.0",
    "msw": "^2.0.0"
  }
}
```

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## Unit Testing

### Component Tests

```typescript
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Utility Function Tests

```typescript
// src/lib/utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './formatters'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('handles negative numbers', () => {
    expect(formatCurrency(-50.5)).toBe('-$50.50')
  })
})

describe('formatDate', () => {
  it('formats ISO date to readable format', () => {
    expect(formatDate('2025-01-15')).toBe('January 15, 2025')
  })

  it('handles invalid dates', () => {
    expect(formatDate('invalid')).toBe('Invalid date')
  })
})
```

### Validation Tests

```typescript
// src/lib/validation/schemas/profile.test.ts
import { describe, it, expect } from 'vitest'
import { ProfileSchema } from './profile'

describe('ProfileSchema', () => {
  it('validates correct profile data', () => {
    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      dateOfBirth: '1990-01-15',
    }

    const result = ProfileSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const invalidData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email',
      dateOfBirth: '1990-01-15',
    }

    const result = ProfileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain('Invalid email')
    }
  })

  it('requires all fields', () => {
    const result = ProfileSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
```

---

## Integration Testing

### Form Integration Tests

```typescript
// src/components/profile/ProfileForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProfileForm } from './ProfileForm'

// Mock server action
vi.mock('@/lib/actions/profile', () => ({
  updateProfileAction: vi.fn(),
}))

describe('ProfileForm Integration', () => {
  it('submits valid form data', async () => {
    const { updateProfileAction } = await import('@/lib/actions/profile')
    vi.mocked(updateProfileAction).mockResolvedValue({ success: true })

    render(<ProfileForm />)

    // Fill form
    await userEvent.type(screen.getByLabelText(/first name/i), 'John')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com')

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    // Verify submission
    await waitFor(() => {
      expect(updateProfileAction).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        })
      )
    })
  })

  it('shows validation errors', async () => {
    render(<ProfileForm />)

    // Submit empty form
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    // Check for errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    })
  })
})
```

### API Mocking with MSW

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock profile API
  http.get('/api/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    })
  }),

  // Mock update API
  http.put('/api/profile', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      data: body,
    })
  }),
]

// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```typescript
// src/test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'
import '@testing-library/jest-dom'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can sign up and sign in', async ({ page }) => {
    // Go to sign up page
    await page.goto('/sign-up')

    // Fill sign up form
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.fill('[name="firstName"]', 'Test')
    await page.fill('[name="lastName"]', 'User')

    // Submit
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome, Test')
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in')

    await page.fill('[name="email"]', 'wrong@example.com')
    await page.fill('[name="password"]', 'wrong')
    await page.click('button[type="submit"]')

    await expect(page.locator('[role="alert"]')).toContainText(
      'Invalid credentials'
    )
  })
})
```

```typescript
// e2e/profile-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('user can update profile', async ({ page }) => {
    await page.goto('/profile')

    // Update name
    await page.fill('[name="firstName"]', 'Updated')
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('[role="status"]')).toContainText(
      'Profile updated'
    )

    // Reload and verify persistence
    await page.reload()
    await expect(page.locator('[name="firstName"]')).toHaveValue('Updated')
  })
})
```

---

## API Testing

### Route Handler Tests

```typescript
// src/app/api/profile/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET, PUT } from './route'

// Mock Supabase
vi.mock('@/lib/supabase/factory', () => ({
  SupabaseClients: {
    authenticated: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '1', firstName: 'John' },
            error: null,
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: '1', firstName: 'Updated' },
                error: null,
              })),
            })),
          })),
        })),
      })),
    })),
  },
}))

describe('Profile API', () => {
  it('GET returns user profile', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('firstName', 'John')
  })

  it('PUT updates user profile', async () => {
    const request = new Request('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName: 'Updated' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.firstName).toBe('Updated')
  })

  it('PUT validates input', async () => {
    const request = new Request('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ email: 'invalid-email' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('validation')
  })
})
```

---

## Database Testing

### Supabase Test Setup

```typescript
// src/test/db-setup.ts
import { createClient } from '@supabase/supabase-js'

export const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_KEY!
)

export async function cleanDatabase() {
  await testSupabase.from('profiles').delete().neq('id', '')
  await testSupabase.from('medications').delete().neq('id', '')
  // Clean other tables...
}

export async function seedTestData() {
  await testSupabase.from('profiles').insert({
    id: 'test-user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  })
}
```

### Database Tests

```typescript
// src/lib/services/profile.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getProfile, updateProfile } from './profile'
import { cleanDatabase, seedTestData } from '@/test/db-setup'

describe('Profile Service', () => {
  beforeEach(async () => {
    await cleanDatabase()
    await seedTestData()
  })

  it('retrieves user profile', async () => {
    const profile = await getProfile('test-user-1')

    expect(profile).toBeDefined()
    expect(profile?.firstName).toBe('Test')
  })

  it('updates user profile', async () => {
    const updated = await updateProfile('test-user-1', {
      firstName: 'Updated',
    })

    expect(updated.firstName).toBe('Updated')
  })

  it('throws error for non-existent user', async () => {
    await expect(getProfile('invalid-id')).rejects.toThrow()
  })
})
```

---

## Authentication Testing

### Mocking Clerk

```typescript
// src/test/mocks/clerk.ts
import { vi } from 'vitest'

export const mockClerkUser = {
  id: 'user_test123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'Test',
  lastName: 'User',
}

vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({
    userId: 'user_test123',
    sessionId: 'sess_test123',
  })),
  currentUser: vi.fn(() => mockClerkUser),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}))
```

### Auth-Protected Component Tests

```typescript
// src/components/Dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Dashboard } from './Dashboard'

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    userId: 'user_123',
    isLoaded: true,
    isSignedIn: true,
  })),
  useUser: vi.fn(() => ({
    user: { firstName: 'Test' },
    isLoaded: true,
  })),
}))

describe('Dashboard', () => {
  it('renders user-specific content when authenticated', () => {
    render(<Dashboard />)
    expect(screen.getByText(/welcome, test/i)).toBeInTheDocument()
  })
})
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## Best Practices

### 1. Test Organization

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx          # Co-located with component
├── lib/
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── formatters.test.ts   # Co-located with utility
│   └── services/
│       ├── profile.ts
│       └── profile.test.ts
e2e/
├── auth-flow.spec.ts             # User flows
├── profile-management.spec.ts
└── fixtures/                     # Test data
```

### 2. Naming Conventions

```typescript
// ✅ GOOD - Descriptive test names
describe('ProfileForm', () => {
  it('shows validation error when email is invalid', () => {})
  it('submits form data when all fields are valid', () => {})
})

// ❌ BAD - Vague test names
describe('ProfileForm', () => {
  it('works', () => {})
  it('test 1', () => {})
})
```

### 3. AAA Pattern

```typescript
it('updates profile successfully', async () => {
  // Arrange
  const user = { id: '1', name: 'John' }
  render(<ProfileForm user={user} />)

  // Act
  await userEvent.type(screen.getByLabelText(/name/i), 'Jane')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))

  // Assert
  await waitFor(() => {
    expect(screen.getByText(/profile updated/i)).toBeInTheDocument()
  })
})
```

### 4. Test Coverage Goals

- **Critical paths**: 100% coverage
- **Business logic**: 90%+ coverage
- **UI components**: 70%+ coverage
- **Utilities**: 90%+ coverage

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail due to async operations

```typescript
// ✅ Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument()
})
```

**Issue**: MSW handlers not working

```typescript
// ✅ Ensure server is started in setup
// src/test/setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
```

**Issue**: Playwright tests timeout

```typescript
// ✅ Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // ... test code
})
```

---

_See also: [CI/CD Pipeline](./DEPLOYMENT_WORKFLOW.md#cicd-pipeline), [Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)_
