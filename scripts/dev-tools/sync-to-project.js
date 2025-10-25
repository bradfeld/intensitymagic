#!/usr/bin/env node

/**
 * Sync dev-standards files to a target project
 * Usage: node scripts/sync-to-project.js /path/to/project [--dry-run]
 */

const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const targetProject = args[0]
const dryRun = args.includes('--dry-run')

if (!targetProject) {
  console.error('❌ Error: Please provide target project path')
  console.log(
    '\nUsage: node scripts/sync-to-project.js /path/to/project [--dry-run]'
  )
  process.exit(1)
}

const projectPath = path.resolve(targetProject)

if (!fs.existsSync(projectPath)) {
  console.error(`❌ Error: Project path does not exist: ${projectPath}`)
  process.exit(1)
}

// Files to sync (source -> destination)
const filesToSync = [
  // Configs
  // Note: tsconfig.json is NOT synced (too project-specific, has comments)
  { src: 'configs/.gitleaks.toml', dest: '.gitleaks.toml' },
  { src: 'configs/.prettierrc', dest: '.prettierrc' },
  { src: 'configs/.mcp.json.template', dest: '.mcp.json' },

  // Scripts (optional - project can customize)
  {
    src: 'scripts/restart-dev-server.js',
    dest: 'scripts/restart-dev-server.js',
    optional: true,
  },
  {
    src: 'scripts/validate-env.js',
    dest: 'scripts/validate-env.js',
    optional: true,
  },

  // Utils (always sync)
  { src: 'utils/logger-enhanced.ts', dest: 'src/lib/utils/logger-enhanced.ts' },

  // Version tracking
  { src: '.dev-standards-version', dest: '.dev-standards-version' },
]

console.log(`\n🔄 Syncing dev-standards to: ${projectPath}`)
console.log(dryRun ? '(DRY RUN - no files will be modified)\n' : '\n')

let syncCount = 0
let skipCount = 0

filesToSync.forEach(({ src, dest, optional, merge }) => {
  const sourcePath = path.join(__dirname, '..', src)
  const destPath = path.join(projectPath, dest)

  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  Source not found: ${src}`)
    return
  }

  // Check if destination exists
  const destExists = fs.existsSync(destPath)

  if (destExists && optional) {
    console.log(`⏭️  Skipping (optional, already exists): ${dest}`)
    skipCount++
    return
  }

  // Regular copy
  const destDir = path.dirname(destPath)

  if (!dryRun) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    fs.copyFileSync(sourcePath, destPath)
    console.log(`✅ Copied: ${dest}`)
  } else {
    console.log(`[DRY RUN] Would copy: ${dest}`)
  }

  syncCount++
})

console.log(`\n📊 Summary:`)
console.log(`   Synced: ${syncCount} files`)
console.log(`   Skipped: ${skipCount} files`)

if (dryRun) {
  console.log(`\n💡 Run without --dry-run to actually sync files`)
} else {
  console.log(`\n✨ Sync complete!`)
  console.log(`\n📝 Next steps:`)
  console.log(`   1. Review changes: cd ${projectPath} && git diff`)
  console.log(`   2. Update CLAUDE.md if needed`)
  console.log(
    `   3. Add MCP env variables to .env.local (see configs/.env.mcp.template)`
  )
  console.log(
    `   4. Commit: git add . && git commit -m "chore: Sync dev-standards"`
  )
}
