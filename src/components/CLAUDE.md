# src/components - UI Component Standards

This directory contains React components for the MedicareMagic UI.

## Component Architecture

### Directory Structure

```
components/
├── ui/                    # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── profile/               # Profile-specific components
├── onboarding/            # Onboarding wizard
├── recommendations/       # Recommendation display
└── [feature]/             # Feature-specific components
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **CSS classes**: kebab-case (`user-profile-card`)

## shadcn/ui + Tailwind CSS

All components use **shadcn/ui** base components with **Tailwind CSS** styling.

### Using Base Components

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter name" />
      <Button>Submit</Button>
    </Card>
  )
}
```

**Never**: Create custom button/input components when shadcn/ui provides them.

## Icon Standards (MANDATORY)

**Use Lucide React only**. No other icon libraries.

### Size Standards

- **Buttons**: `h-4 w-4`
- **Titles/Headers**: `h-5 w-5`
- **Large features**: `h-6 w-6`

```typescript
import { Trash2, Plus, Check } from 'lucide-react'

// ✅ CORRECT - Button icon
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>

// ✅ CORRECT - Title icon
<h2 className="flex items-center">
  <Check className="h-5 w-5 mr-2" />
  Completed
</h2>

// ❌ WRONG - Inconsistent sizing
<Button>
  <Plus className="h-6 w-6" /> {/* Too large for button */}
  Add Item
</Button>
```

## Delete Actions Pattern

Delete buttons/actions **always** use:

- Red X icon (`<X className="h-4 w-4" />`)
- `variant="ghost"`
- No outline

```typescript
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ✅ CORRECT
<Button
  variant="ghost"
  size="icon"
  onClick={handleDelete}
  className="text-destructive hover:text-destructive"
>
  <X className="h-4 w-4" />
</Button>

// ❌ WRONG - Using Trash icon or outline variant
<Button variant="outline" onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</Button>
```

**Why**: Consistency across the app, users expect red X for delete.

## Form Components

Use **Validated** components from `lib/validation/components/`:

```typescript
import { ValidatedInput } from '@/lib/validation/components/ValidatedInput'
import { ValidatedSelect } from '@/lib/validation/components/ValidatedSelect'
import { ValidatedCheckbox } from '@/lib/validation/components/ValidatedCheckbox'

export default function MyForm() {
  const { values, errors, touched, handleChange } = useValidatedForm({
    schema: MySchema,
    initialValues,
    onSubmit,
  })

  return (
    <form>
      <ValidatedInput
        name="email"
        value={values.email}
        error={errors.email}
        touched={touched.email}
        onChange={handleChange}
      />

      <ValidatedSelect
        name="state"
        value={values.state}
        options={stateOptions}
        error={errors.state}
        onChange={handleChange}
      />
    </form>
  )
}
```

**Why**: Automatic error handling, consistent validation UX, accessibility.

See `src/lib/CLAUDE.md` for validation system details.

## Layout Patterns

### Page Headers

Consistent pattern for all authenticated pages:

```typescript
export default function Page() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="text-muted-foreground">Page description</p>
      </div>

      {/* Page content */}
    </div>
  )
}
```

### Spacing

- Page container: `p-6`
- Section spacing: `mb-6` or `space-y-6`
- Card padding: `p-4`
- Form field spacing: `space-y-4`

## Navigation Components

**DO NOT** create custom "Back" buttons or inconsistent headers. Use:

- `<Link>` from `next/link` for navigation
- shadcn/ui `<NavigationMenu>` for menus
- Consistent spacing and hierarchy

### Navigation Menu

Every navigation item **MUST** have a working page:

```typescript
import { NavigationMenu, NavigationMenuItem } from '@/components/ui/navigation-menu'

<NavigationMenu>
  <NavigationMenuItem>
    <Link href="/profile">Profile</Link>
  </NavigationMenuItem>
  <NavigationMenuItem>
    <Link href="/recommendations">Recommendations</Link>
  </NavigationMenuItem>
</NavigationMenu>
```

**Why**: Broken navigation links confuse users.

## Admin-Only Components

Admin sections only visible to users in admin organization:

```typescript
import { auth } from '@clerk/nextjs/server'

export default async function AdminComponent() {
  const { orgId } = await auth()

  // Only show for admin org members
  if (orgId !== process.env.ADMIN_ORG_ID) {
    return null
  }

  return <div>Admin content</div>
}
```

**Security**: Always check on server-side, not just client-side.

## Apostrophes in JSX (CRITICAL)

**Always use escaped apostrophes** (`\'`) in JSX strings, never HTML entities (`&apos;`):

```typescript
// ✅ CORRECT
<p>User\'s Profile</p>
<p>Don\'t forget</p>

// ❌ WRONG - Renders literally as "&apos;"
<p>User&apos;s Profile</p>

// ❌ WRONG - Build error
<p>User's Profile</p>
```

**Why**: HTML entities render as literal text in Next.js, causing bad UX.

## Accessibility

All components must be accessible:

- **Semantic HTML**: Use `<button>` for buttons, `<a>` for links
- **ARIA labels**: Add `aria-label` for icon-only buttons
- **Keyboard navigation**: All interactive elements must be keyboard accessible
- **Focus states**: Visible focus indicators (Tailwind handles this)

```typescript
// ✅ CORRECT - Accessible
<Button aria-label="Delete item" variant="ghost">
  <X className="h-4 w-4" />
</Button>

// ❌ WRONG - No label for screen readers
<Button variant="ghost">
  <X className="h-4 w-4" />
</Button>
```

## Performance

### Lazy Loading

For heavy components not immediately visible:

```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
})

export default function Dashboard() {
  return (
    <div>
      <HeavyChart data={data} />
    </div>
  )
}
```

### Memoization

For expensive computations:

```typescript
import { useMemo } from 'react'

export default function DataTable({ data }: { data: Item[] }) {
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  return <div>{sortedData.map(...)}</div>
}
```

## Common Mistakes in components/

1. **Using HTML entities for apostrophes** - Use `\'` instead
2. **Inconsistent icon sizes** - Follow h-4/h-5/h-6 standards
3. **Delete buttons with wrong variant** - Always use ghost + red X
4. **Missing ARIA labels** - Add for accessibility
5. **Custom buttons instead of shadcn/ui** - Use existing components
6. **Breaking navigation links** - Ensure all links work

## Component Checklist

Before creating a new component:

- [ ] Check if shadcn/ui provides a base component
- [ ] Follow icon size standards (h-4 for buttons, h-5 for titles)
- [ ] Use Validated\* components for forms
- [ ] Escape apostrophes with `\'`
- [ ] Add ARIA labels for icon-only buttons
- [ ] Consistent spacing (p-6 for containers, space-y-4 for forms)
- [ ] Test keyboard navigation

## Key Documentation

- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Lucide React Icons: https://lucide.dev
- `docs/standards/VALIDATION_PATTERNS.md` - Form validation
