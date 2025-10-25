# docs/ - Documentation Standards

This directory contains project documentation, standards, and guides.

## Documentation Philosophy

**Purpose**: Documentation exists to make the team (and future you) more productive. Good docs are:

- **Discoverable** - Easy to find when needed
- **Concise** - Respect reader's time
- **Actionable** - Includes examples and code
- **Maintained** - Kept up-to-date with code

## Directory Structure

```
docs/
├── standards/                    # Development standards (7 files)
│   ├── TYPESCRIPT_STRICT_MODE.md
│   ├── SECURITY_BEST_PRACTICES.md
│   ├── API_STANDARDS.md
│   ├── DATABASE_PATTERNS.md
│   ├── LOGGING_GUIDE.md
│   ├── VALIDATION_PATTERNS.md
│   └── TESTING_STRATEGY.md
├── templates/                    # Code & config templates
│   ├── code/                     # Code file templates
│   └── configs/                  # Configuration templates
├── db/                           # Database documentation
│   ├── CURRENT_SCHEMA_BASELINE_2025.md
│   └── schema-changes/
├── ops/                          # Operations & deployment
├── plans/                        # Master plans for complex work
└── UNIFIED_DEVELOPMENT_STANDARDS.md  # Quick reference guide
```

## When to Create New Standards

Create a new standard file in `standards/` when:

1. **Pattern Emerges** - Same mistake repeated 3+ times
2. **Complex Decision** - Non-obvious architectural choice needs explanation
3. **Onboarding Gap** - New team members repeatedly ask same questions
4. **Best Practice** - Industry best practice we want to codify

**Don't create** for:

- One-off solutions (put in code comments instead)
- Obvious patterns (e.g., "use meaningful variable names")
- Temporary workarounds (document in code, not standards)

## Standard File Template

```markdown
# [Topic] Standards

Brief description of what this standard covers and why it exists.

## Quick Reference

[1-2 paragraphs summarizing the key points]

## The Pattern

[Detailed explanation with code examples]

## Common Mistakes

1. **Mistake**: Description
   - **Why it's wrong**: Explanation
   - **How to fix**: Solution

## Examples

### Good Example

[Code showing correct implementation]

### Bad Example

[Code showing what to avoid]

## Related Documentation

- [Link to related standards]
- [External resources]

## Changelog

- 2025-10-19: Initial creation
- 2025-XX-XX: Updated with new patterns
```

## Cross-Referencing

**Link, don't duplicate**. If content exists elsewhere, reference it:

```markdown
For TypeScript strict mode settings, see `standards/TYPESCRIPT_STRICT_MODE.md`.

For validation patterns:

- Quick reference: `UNIFIED_DEVELOPMENT_STANDARDS.md` line 33-103
- Full guide: `standards/VALIDATION_PATTERNS.md`
```

**Never** copy-paste content between files - it creates maintenance burden.

## Keeping CLAUDE.md Lean

Root `CLAUDE.md` should be **100-200 lines maximum**. Move details to:

- **Implementation patterns** → `src/*/CLAUDE.md` (hierarchical)
- **Comprehensive guides** → `docs/standards/*.md`
- **Troubleshooting** → `docs/TROUBLESHOOTING.md`
- **API reference** → Inline JSDoc comments

**Rule of thumb**: If it's more than 20 lines, it doesn't belong in root CLAUDE.md.

## Updating UNIFIED_DEVELOPMENT_STANDARDS.md

`UNIFIED_DEVELOPMENT_STANDARDS.md` is a **quick reference**, not comprehensive guide.

**Structure**:

1. Brief overview (10 lines)
2. Quick example (5-10 lines code)
3. Link to detailed standard

**Target**: 300-400 lines total (currently 1,435 - needs consolidation).

**When adding new standard**:

1. Create detailed file in `standards/`
2. Add 15-20 line summary to UNIFIED
3. Link to detailed file

## Documentation Maintenance

### When to Update

Update docs when:

- **Code patterns change** - New architecture, refactored patterns
- **Bugs from misunderstanding** - If bug trace to unclear docs
- **Questions from team** - Repeated questions indicate doc gap
- **Best practices evolve** - Industry standards change

### Don't Update

Don't update for:

- Minor code tweaks that don't affect patterns
- Temporary workarounds
- Experimental features (wait until stable)

### Deprecation

When a pattern is deprecated:

```markdown
## ~~Old Pattern~~ (DEPRECATED)

**⚠️ This pattern is deprecated as of 2025-10-19.**

**Use instead**: See `NEW_PATTERN.md`

**Why deprecated**: [Brief explanation]

[Keep old docs for reference but mark clearly]
```

## Database Schema Documentation

**Critical**: `db/CURRENT_SCHEMA_BASELINE_2025.md` must be kept current.

**Update when**:

- New migration added
- Tables modified
- RLS policies changed

**Format**:

```markdown
# Current Schema Baseline

Last updated: 2025-10-19

## Tables (16 total)

### profiles

- **Purpose**: User profile data
- **RLS**: Users can only see their own row
- **Key columns**: id, clerk_user_id, email, ...

[Repeat for each table]
```

## Master Plans

For complex multi-phase work, create master plans in `plans/`:

**Naming**: `YYYY-MM-DD-feature-name.md`

**Template**:

```markdown
# [Feature Name] - Master Plan

**Created**: 2025-10-19
**Status**: In Progress
**Linear**: MED-123

## Overview

[What are we building and why]

## Phases

### Phase 1: [Name]

- [x] Task 1
- [ ] Task 2

### Phase 2: [Name]

- [ ] Task 1

## Technical Decisions

### Decision 1

**Choice**: Use approach X
**Alternatives considered**: Y, Z
**Rationale**: [Why X is best]

## Progress Log

- 2025-10-19: Created plan, started Phase 1
- 2025-10-20: Completed Phase 1, blocked on...
```

## Changelog Convention

Every standard file should have a changelog at the bottom:

```markdown
## Changelog

- 2025-10-19: Initial creation (@username)
- 2025-10-20: Added section on X (@username)
- 2025-10-25: Updated examples after TypeScript upgrade (@username)
```

**Why**: Track evolution, understand context for changes.

## Documentation Checklist

Before committing doc changes:

- [ ] Cross-references are correct and links work
- [ ] Code examples are tested and accurate
- [ ] No duplicate content (use links instead)
- [ ] Changelog updated
- [ ] If comprehensive guide, ensure UNIFIED references it
- [ ] If pattern change, update relevant CLAUDE.md files

## Common Documentation Mistakes

1. **Duplicating content** - Link instead
2. **Too much in CLAUDE.md** - Move to standards/
3. **Stale examples** - Code changed but docs didn't
4. **Missing cross-references** - Reader can't find related info
5. **No changelog** - Can't track why something changed

## Key Meta-Documentation

- Root `CLAUDE.md` - High-level project guide
- `src/*/CLAUDE.md` - Directory-specific implementation details
- This file - How to maintain all the above
- `CONFIGURATION_IMPROVEMENTS.md` - Analysis and recommendations
