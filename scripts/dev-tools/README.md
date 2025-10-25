# Development Tools

Utility scripts extracted from the dev-standards repository. These tools support development workflow, environment validation, and project templating.

## Available Tools

### Environment & Validation

**validate-env.js**

- Validates that required environment variables are set
- Checks for common configuration issues
- Usage: `npm run validate-env`

**check-version.js**

- Checks project configuration version against dev-standards
- Useful if maintaining multiple projects with shared configs
- Usage: `node scripts/dev-tools/check-version.js`

### Development Utilities

**restart-dev-server.js**

- Cleanly kills port 3000 and restarts the dev server
- Handles cases where dev server is stuck
- Usage: `npm run restart`

**run-tests-if-any.js**

- Conditionally runs tests if test files exist
- Prevents errors in projects without tests
- Usage: `npm run test`

### Project Synchronization

**sync-to-project.js**

- Syncs configuration files to another project
- Copies shared configs (tsconfig, prettier, gitleaks, etc.)
- Usage: `node scripts/dev-tools/sync-to-project.js /path/to/project`

**sync-all-projects.js**

- Syncs configs to all projects listed in `.dev-standards-projects.json`
- Batch sync for managing multiple projects
- Usage: `node scripts/dev-tools/sync-all-projects.js`

**pull-from-source.js**

- Pulls updated configs FROM a source project TO dev-standards
- Reverse sync for when configs are updated in an active project
- Usage: `node scripts/dev-tools/pull-from-source.js /path/to/source`

## Origin

These tools were extracted from the dev-standards repository on 2025-10-18 and adapted for use within the medicaremagic project structure.

For original dev-standards documentation, see `~/Code copy/archived/dev-standards-20251018/`.

## Integration with MedicareMagic

The following scripts are integrated into package.json:

```json
{
  "scripts": {
    "restart": "node scripts/dev-tools/restart-dev-server.js",
    "test": "node scripts/dev-tools/run-tests-if-any.js",
    "validate-env": "node scripts/dev-tools/validate-env.js"
  }
}
```

## Future Projects

When creating new projects from the medicaremagic template using `scripts/init-new-project.sh`, these dev tools will be included automatically.

You can use `sync-to-project.js` to share configurations with other projects that weren't created from this template.
