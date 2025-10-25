# Claude Code Hooks Configuration

Hooks are shell commands that execute automatically at specific points in Claude Code's lifecycle.

## ⚠️ New Hooks Format (2025)

**The hooks format has changed!** Hooks now use an object-based structure instead of arrays.

**Old format (DEPRECATED)**:

```json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": "Edit|Write",
      "command": "echo done"
    }
  ]
}
```

**New format (CORRECT)**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo done"
          }
        ]
      }
    ]
  }
}
```

## Configured Hooks

### 1. Auto-Format Before Edit (PreToolUse)

**Trigger**: Before Claude edits or writes any file
**Command**: Prettier auto-format
**Purpose**: Ensure all code changes are properly formatted

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$FILE\""
          }
        ]
      }
    ]
  }
}
```

**Note**: This is currently **commented out** in settings to avoid unexpected formatting. To enable, add to `.claude/settings.local.json`.

### 2. Type Check After Edit (PostToolUse)

**Trigger**: After Claude successfully edits TypeScript files
**Command**: Run type-check
**Purpose**: Immediate feedback on type errors

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run type-check"
          }
        ]
      }
    ]
  }
}
```

**Note**: Currently **commented out** because it runs on every edit (can be slow). Consider enabling for critical work.

### 3. Changelog Logger (PostToolUse)

**Trigger**: After any file edit
**Command**: Log to changelog
**Purpose**: Track all code changes Claude makes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$(date '+%Y-%m-%d %H:%M:%S'): Edited $FILE\" >> .claude/changelog.txt"
          }
        ]
      }
    ]
  }
}
```

**Status**: ✅ ACTIVE

## How to Configure

### Option 1: Interactive (Recommended for beginners)

In Claude Code, run:

```
/hooks
```

This opens an interactive menu to configure hooks.

### Option 2: Direct Edit (Recommended for power users)

Edit `.claude/settings.local.json` directly using the **new format**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$(date '+%Y-%m-%d %H:%M:%S'): Edited $FILE\" >> .claude/changelog.txt"
          }
        ]
      }
    ]
  }
}
```

## Hook Events

- **PreToolUse** - Before Claude executes any tool
- **PostToolUse** - After a tool completes successfully
- **Stop** - When Claude stops execution
- **Notification** - On system notifications

## Matchers

Use regex to match specific tools:

- `Edit|Write` - File modifications
- `Bash` - Shell commands
- `Read` - File reads
- `.*` - All tools

You can also match specific file patterns in the command using `$FILE` variable.

## Available Variables

- `$FILE` - The file being operated on (for Edit/Write)
- `$TOOL` - The tool being executed
- Other environment variables from your shell

## Security Warning

⚠️ **Hooks execute with your credentials**. Always review hook commands before adding, especially from untrusted sources. Malicious hooks can damage your system or exfiltrate data.

## Recommended Hooks to Consider

### For Production Work

1. **Auto-format on save** - Keep code consistently formatted
2. **Type check after edit** - Catch errors immediately
3. **Lint on save** - Enforce code quality

### For Debugging

1. **Changelog logger** - Track what Claude changes (ACTIVE)
2. **Diff tracker** - Log actual code changes: `git diff $FILE >> .claude/diffs.txt`

### For Notifications

1. **Build complete** - Alert when long builds finish
2. **Deployment done** - Notify on deployment completion

## Disabling Hooks

To temporarily disable all hooks without deleting them:

```json
{
  "hooks": {}
}
```

Or remove specific hook types:

```json
{
  "hooks": {
    "PostToolUse": [],
    "PreToolUse": []
  }
}
```

## Testing Hooks

After adding a hook:

1. Make a small edit to a test file
2. Check if the hook executed (look for the expected output)
3. If it didn't work, check the command syntax
4. Review Claude Code debug output with `--mcp-debug` flag

## Current Hook Status

| Hook        | Status      | Reason                                  |
| ----------- | ----------- | --------------------------------------- |
| Auto-format | ❌ Disabled | Can cause unexpected formatting changes |
| Type-check  | ❌ Disabled | Runs on every edit (slow)               |
| Changelog   | ✅ Active   | Useful for tracking changes             |

## Where Hooks Are Stored

- **Project-specific**: `.claude/settings.local.json` (gitignored)
- **Global**: `~/.claude/settings.local.json`

**Recommendation**: Use project-specific for project-specific hooks, global for hooks you want in all projects.

## Next Steps

1. Review the example hooks above
2. Decide which hooks would improve your workflow
3. Add them via `/hooks` or edit settings.local.json
4. Test with a small file edit
5. Adjust as needed
