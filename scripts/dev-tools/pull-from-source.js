#!/usr/bin/env node

/**
 * Pull updated configs from source project (MedicareMagic) to dev-standards
 * Usage: node scripts/pull-from-source.js [--dry-run]
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// Source project (where standards originate)
const SOURCE_PROJECT = path.join(process.env.HOME, 'Code', 'medicaremagic')

// Files to pull from source project
const FILES_TO_PULL = [
  {
    source: '.prettierrc',
    dest: 'configs/.prettierrc',
    description: 'Prettier configuration',
  },
  {
    source: '.gitleaks.toml',
    dest: 'configs/.gitleaks.toml',
    description: 'Gitleaks secret scanning rules',
  },
  {
    source: 'tsconfig.json',
    dest: 'configs/tsconfig.base.json',
    description: 'TypeScript configuration',
  },
  {
    source: 'src/lib/utils/logger-enhanced.ts',
    dest: 'utils/logger-enhanced.ts',
    description: 'Enhanced logger utility',
  },
  {
    source: 'scripts/restart-dev-server.js',
    dest: 'scripts/restart-dev-server.js',
    description: 'Dev server restart script',
    optional: true,
  },
  {
    source: 'scripts/validate-env.js',
    dest: 'scripts/validate-env.js',
    description: 'Environment validation script',
    optional: true,
  },
]

console.log('\n📥 Pulling configs from source project to dev-standards')
console.log(`Source: ${SOURCE_PROJECT}`)
console.log(dryRun ? '(DRY RUN - no files will be modified)\n' : '\n')

// Check if source project exists
if (!fs.existsSync(SOURCE_PROJECT)) {
  console.error(`❌ Error: Source project not found at ${SOURCE_PROJECT}`)
  process.exit(1)
}

let pullCount = 0
let skipCount = 0
let changedCount = 0

FILES_TO_PULL.forEach(({ source, dest, description, optional }) => {
  const sourcePath = path.join(SOURCE_PROJECT, source)
  const destPath = path.join(__dirname, '..', dest)

  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    if (optional) {
      console.log(`⏭️  ${description} - Source not found (optional), skipping`)
      skipCount++
      return
    } else {
      console.error(`❌ ${description} - Source not found at ${source}`)
      process.exit(1)
    }
  }

  // Read both files to compare
  const sourceContent = fs.readFileSync(sourcePath, 'utf8')
  const destExists = fs.existsSync(destPath)
  const destContent = destExists ? fs.readFileSync(destPath, 'utf8') : ''

  // Check if files are different
  if (sourceContent === destContent) {
    console.log(`✅ ${description} - Already up to date`)
    skipCount++
    return
  }

  // Files are different - copy over
  if (!dryRun) {
    const destDir = path.dirname(destPath)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    fs.writeFileSync(destPath, sourceContent)
    console.log(`📝 ${description} - Updated`)
  } else {
    console.log(`[DRY RUN] ${description} - Would be updated`)
  }

  changedCount++
  pullCount++
})

console.log(`\n📊 Summary:`)
console.log(`   Updated: ${changedCount} files`)
console.log(`   Up to date: ${skipCount} files`)

if (dryRun) {
  console.log(`\n💡 Run without --dry-run to actually pull files`)
  process.exit(0)
}

if (changedCount > 0) {
  console.log(`\n📝 Next steps:`)
  console.log(`   1. Review changes: git diff`)
  console.log(`   2. Bump version if needed: npm run bump:minor`)
  console.log(
    `   3. Commit: git add . && git commit -m "feat: Update configs from MedicareMagic"`
  )
  console.log(`   4. Push: git push`)
  console.log(`   5. Sync to other projects: npm run sync:all`)
} else {
  console.log(`\n✨ All configs are already up to date!`)
}
