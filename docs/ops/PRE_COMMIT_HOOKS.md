# Pre-Commit Hooks

This document explains the pre-commit hooks configured for the MedicareMagic repository.

## Overview

Pre-commit hooks automatically run before every `git commit` to ensure code quality and security. They help catch issues early and prevent CI failures.

## Configured Hooks

### 1. Prettier Auto-Formatting

**What it does:** Automatically formats all staged files with Prettier before committing.

**Why:** Ensures code formatting consistency and prevents CI failures on the `npm run format:check` step.

**Implementation:**

```bash
npx prettier --write --ignore-unknown $(git diff --cached --name-only --diff-filter=ACM)
git add -u
```

**What happens:**

- Prettier formats all staged files
- Changes are automatically re-staged
- Commit proceeds with formatted code

**Benefits:**

- ✅ No more manual `npm run format` needed
- ✅ CI never fails on formatting
- ✅ Consistent code style across team

### 2. Secret Detection (Gitleaks)

**What it does:** Scans staged files for accidentally committed secrets (API keys, passwords, tokens, etc.)

**Why:** Prevents security incidents from exposing credentials in git history.

**Implementation:**

```bash
gitleaks detect --source "$TEMP_DIR" --verbose --redact --no-git
```

**What happens:**

- Gitleaks scans staged files for patterns matching secrets
- If secrets are found, commit is blocked
- You must remove the secret and add it to `.env.local`

**Benefits:**

- ✅ Prevents accidental secret exposure
- ✅ Protects API keys, credentials, tokens
- ✅ Enforces use of `.env.local` for secrets

## How It Works

When you run `git commit`:

1. **Prettier runs first** - Formats your staged files
2. **Gitleaks runs second** - Scans for secrets
3. **Commit proceeds** - Only if both checks pass

## Bypassing Hooks (NOT RECOMMENDED)

If you absolutely must bypass the hooks:

```bash
git commit --no-verify -m "Your message"
```

⚠️ **WARNING:** Only use `--no-verify` for:

- False positive secret detections (document why in commit message)
- Emergency hotfixes (fix properly afterward)

**Never bypass for:**

- ❌ Skipping code formatting
- ❌ Committing actual secrets
- ❌ Avoiding code quality checks

## Troubleshooting

### Prettier Hook Fails

**Problem:** `npx prettier` command fails

**Solution:**

1. Ensure dependencies are installed: `npm ci`
2. Check Prettier config: `.prettierrc`
3. Verify file patterns: `.prettierignore`

### Gitleaks False Positive

**Problem:** Gitleaks blocks a commit that doesn't contain secrets

**Solution:**

1. Review `.gitleaks.toml` allowlist
2. Add specific pattern to allowlist if legitimate
3. Document reason in allowlist comment

### Hook Not Running

**Problem:** Pre-commit hook doesn't execute

**Solution:**

1. Check hook is executable: `chmod +x .husky/pre-commit`
2. Verify Husky is installed: `npm run prepare`
3. Check `.husky/pre-commit` exists

## CI Pipeline Integration

The pre-commit hooks align with CI checks:

| Pre-Commit Hook | CI Check               | Purpose               |
| --------------- | ---------------------- | --------------------- |
| Prettier        | `npm run format:check` | Code formatting       |
| Gitleaks        | (Manual review)        | Secret detection      |
| (none)          | `npm run type-check`   | TypeScript validation |
| (none)          | `npm run lint`         | ESLint validation     |
| (none)          | `npm run build`        | Build verification    |

**Why not all CI checks in pre-commit?**

- **Prettier:** Fast, auto-fixable → pre-commit
- **Gitleaks:** Security-critical → pre-commit
- **TypeScript/ESLint:** Slower, require full context → CI only
- **Build:** Very slow, environment-specific → CI only

## Maintenance

### Updating Prettier

```bash
npm install -D prettier@latest
npm run format
git add .
git commit -m "chore: Update Prettier"
```

### Updating Gitleaks

```bash
brew upgrade gitleaks  # macOS
# or download from https://github.com/gitleaks/gitleaks
```

### Modifying Hooks

1. Edit `.husky/pre-commit`
2. Test with dummy commit
3. Document changes in this file
4. Commit and push

## Related Documentation

- [SECRET_SCANNING_SETUP.md](SECRET_SCANNING_SETUP.md) - Gitleaks configuration
- [CI/CD Pipeline](.github/workflows/ci.yml) - Full CI validation
- [CLAUDE.md](../CLAUDE.md) - Development standards
