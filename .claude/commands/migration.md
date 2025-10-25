Helper for creating and applying database migrations.

**Workflow:**

1. Check current schema:
   - Read `docs/db/CURRENT_SCHEMA_BASELINE_2025.md`
   - Show user the 16 existing tables

2. Ask user: "What schema changes do you need?"
   - Examples: Add column, new table, modify constraint, etc.

3. Generate migration file:
   - Create file in `supabase/migrations/` with timestamp
   - Name format: `YYYYMMDDHHMMSS_description.sql`
   - Include both UP (apply) and DOWN (rollback) SQL

4. Show user the generated SQL

5. On user approval:
   - Ask: "Apply this migration? This will modify the production database."
   - If yes, use Supabase MCP or direct connection to apply

6. After successful migration:
   - Regenerate TypeScript types: `npx supabase gen types typescript --project-id [ID] > src/lib/types/database.ts`
   - Update `docs/db/CURRENT_SCHEMA_BASELINE_2025.md` with new schema
   - Run type-check to catch any breaking changes

7. Remind user to test affected code paths

**Safety:**

- Always show SQL before applying
- Always get explicit confirmation
- Always update documentation after migration
- Always regenerate types
