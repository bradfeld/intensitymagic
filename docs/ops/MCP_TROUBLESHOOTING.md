# MCP Server Troubleshooting Guide

This document provides troubleshooting procedures for Claude Code MCP (Model Context Protocol) servers.

## Quick Reference

### Check MCP Server Status

```bash
claude mcp list
```

### Get MCP Server Details

```bash
claude mcp get <server-name>
```

### Reconfigure MCP Server

```bash
claude mcp remove <server-name> -s local
claude mcp add <server-name> "<url>" -s local
```

## Common Issues

### Issue 1: Supabase MCP Connection Timeouts

**Symptoms:**

- All Supabase MCP queries timeout
- Error: `Connection terminated due to connection timeout`

**Diagnosis:**

1. Check which project the MCP is connected to:
   ```bash
   claude mcp get supabase
   ```
2. Verify it shows the correct `project_ref` in the URL
3. Check if it's in read-only mode (look for `read_only=true` in URL)

**Root Causes:**

- Connected to wrong Supabase project (preview instead of production)
- Read-only mode enabled when write access needed
- MCP configured as `stdio` type instead of `http`

**Solution:**

```bash
# Remove old configuration
claude mcp remove supabase -s local

# Add with correct production project and write access
claude mcp add supabase "https://mcp.supabase.com/mcp?project_ref=<production-project-ref>" -s local
```

**Verify correct configuration** in `~/.claude.json`:

```json
{
  "projects": {
    "/path/to/project": {
      "mcpServers": {
        "supabase": {
          "type": "http",
          "url": "https://mcp.supabase.com/mcp?project_ref=<production-ref>"
        }
      }
    }
  }
}
```

**Important Notes:**

- Read-only mode (`read_only=true`) prevents migrations and writes
- Default mode (no `read_only` parameter) allows writes
- The `type` must be `http`, not `stdio` for HTTP-based MCPs
- Changes require restarting Claude Code session

### Issue 2: Wrong Supabase Project Connected

**Symptoms:**

- Queries work but affect wrong database
- Preview data appears instead of production

**Diagnosis:**

```bash
# Check MCP configuration
claude mcp get supabase

# List available Supabase projects
supabase projects list

# Check which project is linked
cat supabase/config.toml | grep project_id
```

**Solution:**
Reconfigure MCP with correct project:

- **medicaremagic-preview**: `byjniagtgbzdpmrfqzed`
- **medicaremagic-prod**: `bsuotftwneabfqtrhviq`

### Issue 3: Database Password Authentication Failures

**Symptoms:**

- `supabase link` fails with SCRAM auth error
- `psql` connection refused with "Wrong password"

**Root Causes:**

- Local `$SUPABASE_PROD_PASSWORD` environment variable is outdated
- Vercel's `POSTGRES_PASSWORD` is for Vercel Postgres, not Supabase
- Password contains special characters that need escaping

**Diagnosis:**

```bash
# Check what passwords are available
env | grep -i "SUPABASE\|POSTGRES" | cut -d'=' -f1

# Pull production passwords from Vercel
vercel env pull .env.vercel.temp --environment production --yes
grep "POSTGRES_PASSWORD\|SUPABASE" .env.vercel.temp
```

**Solution:**
Use Supabase MCP instead of CLI when possible. If CLI is needed:

1. Get correct password from Supabase dashboard
2. Update local environment variable
3. Or use MCP for read/write operations (bypasses password auth)

## MCP Server Configuration Best Practices

### Always Check MCP Status First

Before diagnosing Supabase issues, always run:

```bash
claude mcp list
```

This shows:

- Which MCPs are configured and connected
- Which project each MCP is connected to
- Whether connection is healthy

### Project-Specific MCP Configuration

MCP servers are configured per-project in `~/.claude.json`:

```json
{
  "projects": {
    "/Users/username/Code/project": {
      "mcpServers": {
        "linear": {
          "type": "sse",
          "url": "https://mcp.linear.app/sse"
        },
        "vercel": {
          "type": "http",
          "url": "https://mcp.vercel.com"
        },
        "supabase": {
          "type": "http",
          "url": "https://mcp.supabase.com/mcp?project_ref=<project-ref>"
        }
      }
    }
  }
}
```

### When to Use Each MCP

**Linear MCP:**

- Reading/updating issues
- Creating comments
- Checking issue status
- **Use instead of**: Linear CLI commands

**Vercel MCP:**

- Listing deployments
- Getting deployment status
- Checking project configuration
- **Use instead of**: `vercel` CLI where possible

**Supabase MCP:**

- Reading database schema
- Executing queries (when not in read-only)
- Applying migrations (when not in read-only)
- **Use instead of**: `supabase` CLI and `psql`

## Verifying MCP Configuration

### Test Connection

After reconfiguring, test the MCP in a new Claude Code session:

```typescript
// Use MCP tools to verify connection
mcp__supabase__list_tables()
mcp__vercel__list_projects()
mcp__linear__list_issues()
```

### Check Logs

If MCP is failing:

1. Run `/doctor` command in Claude Code
2. Check `~/.claude/logs/` for detailed error messages
3. Run with `--mcp-debug` flag for verbose output

## Reference: MedicareMagic MCP Setup

### Current Production Configuration

**Supabase Production:**

- Project ID: `bsuotftwneabfqtrhviq`
- URL: `https://bsuotftwneabfqtrhviq.supabase.co`
- MCP URL: `https://mcp.supabase.com/mcp?project_ref=bsuotftwneabfqtrhviq`

**Supabase Preview:**

- Project ID: `byjniagtgbzdpmrfqzed`
- URL: `https://byjniagtgbzdpmrfqzed.supabase.co`
- MCP URL: `https://mcp.supabase.com/mcp?project_ref=byjniagtgbzdpmrfqzed`

**Vercel:**

- Team: `medicaremagic`
- Project: `medicaremagic`
- MCP URL: `https://mcp.vercel.com`

**Linear:**

- Workspace: `medicaremagic`
- MCP URL: `https://mcp.linear.app/sse`

## Session Continuity Note

**Important:** MCP configuration changes require restarting Claude Code session to take effect. After reconfiguring an MCP:

1. End current Claude Code session
2. Start new session
3. Verify MCP connection with `/mcp` command

## Related Documentation

- [Supabase MCP Documentation](https://mcp.supabase.com/)
- [Vercel MCP Documentation](https://mcp.vercel.com/)
- [Linear MCP Documentation](https://mcp.linear.app/)
- [Claude Code MCP Guide](https://docs.claude.com/en/docs/claude-code/mcp)
