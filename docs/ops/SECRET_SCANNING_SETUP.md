# Secret Scanning Setup (MED-242)

This document explains the Gitleaks-based secret scanning system configured to prevent accidental commits of sensitive credentials.

## Overview

**Tool**: [Gitleaks](https://github.com/gitleaks/gitleaks) v8.28.0
**Hook**: Husky pre-commit hook
**Status**: ✅ Active as of January 2025

## What It Does

Gitleaks automatically scans all files being committed for potential secrets:

- API keys (OpenAI, Clerk, Supabase, AWS, etc.)
- JWT tokens
- Webhook secrets
- Database credentials
- OAuth tokens

**If secrets are detected**: The commit is blocked with clear instructions for resolution.

## Installation (Already Complete)

```bash
# Install Gitleaks
brew install gitleaks

# Pre-commit hook is already configured in .husky/pre-commit
# No additional setup needed!
```

## Configuration Files

### [`.gitleaks.toml`](/.gitleaks.toml)

Defines detection rules and allowlists:

- **Custom rules** for MedicareMagic-specific patterns
- **Allowlisted paths** (docs/, env-template.txt, .env.production.example)
- **Allowlisted patterns** (placeholder values like `your_`, `test_`, `example_`)

### [`.husky/pre-commit`](/.husky/pre-commit)

Pre-commit hook that:

1. Extracts staged files
2. Scans them with Gitleaks
3. Blocks commit if secrets are found
4. Provides remediation instructions

## Usage

### Normal Workflow

Just commit as usual - the hook runs automatically:

```bash
git add .
git commit -m "feat: add new feature"
# Hook runs automatically - commit proceeds if no secrets detected
```

### If Secrets Are Detected

```
❌ Gitleaks detected potential secrets in your staged files!

To fix this:
1. Remove the secret from the file
2. Add it to .env.local (never committed)
3. If it's a false positive, update .gitleaks.toml allowlist
```

**Resolution**:

```bash
# 1. Remove the secret from your file
# 2. Add it to .env.local
echo "OPENAI_API_KEY=sk-real-key-here" >> .env.local

# 3. Update your code to read from environment
const apiKey = process.env.OPENAI_API_KEY

# 4. Stage and commit again
git add .
git commit -m "feat: add new feature"
```

### Bypass Hook (NOT RECOMMENDED)

Only use in emergencies (e.g., false positive blocking urgent deploy):

```bash
git commit --no-verify -m "emergency fix"
```

**⚠️ Warning**: Bypassing the hook means secrets could be committed! Only use if you're certain the detection is a false positive.

## Adding Custom Rules

Edit [`.gitleaks.toml`](/.gitleaks.toml) to add new patterns:

```toml
[[rules]]
id = "custom-api-key"
description = "My Custom API Key"
regex = '''custom_api_[A-Za-z0-9]{32,}'''
tags = ["key", "custom"]
```

## Allowlisting False Positives

### By Path

Add to `.gitleaks.toml`:

```toml
[allowlist]
paths = [
  '''docs/examples/'''
]
```

### By Pattern

Add to `.gitleaks.toml`:

```toml
[allowlist]
regexes = [
  '''example_api_key_[0-9]+'''
]
```

### By Stop Word

Add to `.gitleaks.toml`:

```toml
[allowlist]
stopwords = [
  "example",
  "placeholder"
]
```

## Testing

Test the hook is working:

```bash
# Create a file with a fake secret (not a real pattern)
echo "API_KEY=real_looking_key_12345" > test.txt

# Try to commit
git add test.txt
git commit -m "test"

# Hook should scan the file
# Clean up
rm test.txt
git reset HEAD test.txt
```

## Manual Scanning

Scan entire repository for secrets:

```bash
# Scan all files (including history)
gitleaks detect --source . --verbose

# Scan only uncommitted changes
gitleaks protect --staged --verbose

# Scan specific file
gitleaks detect --source path/to/file --no-git
```

## Related Documentation

- [SECURITY_SECRETS_HARDENING.md](./SECURITY_SECRETS_HARDENING.md) - Secret rotation procedures
- [THREE_TIER_DEPLOYMENT_PIPELINE.md](./THREE_TIER_DEPLOYMENT_PIPELINE.md) - Environment setup
- [.env.production.example](/.env.production.example) - Production environment template

## Maintenance

### Updating Gitleaks

```bash
brew upgrade gitleaks
gitleaks version  # Verify new version
```

### Quarterly Review

Every 3 months:

1. Review `.gitleaks.toml` allowlists (remove outdated patterns)
2. Test hook is working with `git commit` on a test file
3. Check for Gitleaks updates
4. Review any bypassed commits (`git log --grep="--no-verify"`)

## Troubleshooting

### Hook Not Running

```bash
# Verify hook is executable
ls -la .husky/pre-commit
chmod +x .husky/pre-commit

# Reinstall Husky
npm install
```

### Gitleaks Not Found

```bash
# Install Gitleaks
brew install gitleaks

# Verify installation
which gitleaks
gitleaks version
```

### False Positives

If Gitleaks blocks a legitimate commit:

1. **Short-term**: Bypass with `--no-verify` (document in commit message why)
2. **Long-term**: Update `.gitleaks.toml` allowlist

## History

- **January 2025**: Initial setup (MED-242)
  - Installed Gitleaks v8.28.0
  - Configured custom rules for Supabase Secret Keys
  - Created pre-commit hook
  - Completed after MED-251 (Supabase secret key migration)
