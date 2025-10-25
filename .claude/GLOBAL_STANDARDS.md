# Global Development Standards

These standards apply to ALL projects you work on, regardless of language or framework.

## Core Principles

### Permission and Communication

- **Permissions are controlled by settings.json and settings.local.json**
- Check your settings files for current permission configuration
- When in doubt about a destructive operation, ask the user
- **NEVER** use emojis in responses or code (they trigger audio notifications)
- Keep communication professional and concise

### Planning First

- For complex work (>3 files or >30 minutes), present a detailed plan FIRST
- Get plan approval before implementation
- Break large tasks into phases
- Use TodoWrite tool to track progress

### Code Quality

- Clean, readable, maintainable code
- Follow project-specific style guides and conventions
- Proper error handling and logging
- Type safety (TypeScript, Python types, etc.)
- No commented-out code in commits

### Testing & Deployment

- **Test locally FIRST** before any production deployment
- **NEVER** push broken code to production
- Run all validation checks before requesting deployment approval
- Feature branches for non-trivial work

### Git Conventions

- Descriptive commit messages
- Never commit secrets or environment files
- Reference issue trackers when applicable
- Clean git history

## TypeScript Projects

- Use strict mode settings
- Proper type narrowing for nullables and optionals
- No `any` types without justification
- Interface over type for object shapes

## Security

- Never hardcode credentials
- Use environment variables for config
- Validate all user input
- Follow principle of least privilege
- Keep dependencies updated

## Documentation

- Keep README.md current
- Document complex business logic
- Add comments for "why", not "what"
- Maintain project-specific CLAUDE.md or equivalent

## Project-Specific Instructions

Each project should have its own CLAUDE.md (or equivalent) file with:

- Project overview and purpose
- Tech stack and architecture
- Development commands
- Testing procedures
- Deployment workflow
- Common pitfalls and troubleshooting

Remember: These are baseline standards. Always defer to project-specific conventions when they exist.

---

## Configuration File Structure

### Settings File Override Behavior

- `~/.claude/settings.json` - Base settings that apply globally
- `~/.claude/settings.local.json` - Local overrides for development
- Values in settings.local.json will override matching values in settings.json
- This follows the standard pattern of .local files overriding base configs

### MCP Server Configuration

- `~/.claude/mcp.json` - Defines available MCP servers (Linear, Supabase, Figma) with connection details
- `settings.local.json` has `enabledMcpjsonServers: ["linear", "supabase"]` to control which are active
- Both files work together: mcp.json defines servers, settings.local.json enables/disables them
- This separation is by design - mcp.json can be shared, while settings.local.json contains personal preferences
