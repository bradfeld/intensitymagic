#!/usr/bin/env node

/**
 * Sync dev-standards to all registered projects
 * Usage: node scripts/sync-all-projects.js [--dry-run] [--auto-commit]
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load projects from config file
const configPath = path.join(__dirname, '..', '.dev-standards-projects.json')
let PROJECTS = []

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  PROJECTS = config.projects.map(p => p.path.replace('~', process.env.HOME))
} else {
  // Fallback: default projects
  PROJECTS = [
    path.join(process.env.HOME, 'Code', 'medicaremagic'),
    path.join(process.env.HOME, 'Code', 'authormagic'),
  ]
  console.warn('⚠️  No config file found, using default projects')
  console.warn(`   Create ${configPath} to customize\n`)
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const autoCommit = args.includes('--auto-commit')

const currentVersion = fs
  .readFileSync(path.join(__dirname, '..', '.dev-standards-version'), 'utf8')
  .trim()

console.log('\n🔄 Syncing dev-standards to all projects')
console.log(`Version: ${currentVersion}`)
console.log(dryRun ? '(DRY RUN MODE)\n' : '\n')

let successCount = 0
let skipCount = 0
let errorCount = 0

PROJECTS.forEach(projectPath => {
  const projectName = path.basename(projectPath)

  if (!fs.existsSync(projectPath)) {
    console.log(`⏭️  ${projectName} - Project not found, skipping`)
    skipCount++
    return
  }

  // Check current version
  const versionFile = path.join(projectPath, '.dev-standards-version')
  const projectVersion = fs.existsSync(versionFile)
    ? fs.readFileSync(versionFile, 'utf8').trim()
    : 'not-installed'

  if (projectVersion === currentVersion) {
    console.log(`✅ ${projectName} - Already up to date (v${currentVersion})`)
    skipCount++
    return
  }

  console.log(
    `\n📦 ${projectName} - Updating from v${projectVersion} to v${currentVersion}`
  )

  try {
    // Run sync script
    const syncScript = path.join(__dirname, 'sync-to-project.js')
    const syncCommand = `node "${syncScript}" "${projectPath}"${dryRun ? ' --dry-run' : ''}`

    if (!dryRun) {
      execSync(syncCommand, { stdio: 'inherit' })

      // Auto-commit if requested
      if (autoCommit) {
        process.chdir(projectPath)

        // Check if there are changes
        const status = execSync('git status --porcelain', { encoding: 'utf8' })

        if (status.trim()) {
          execSync('git add .', { stdio: 'inherit' })
          execSync(
            `git commit -m "chore: Update dev-standards to v${currentVersion}"`,
            { stdio: 'inherit' }
          )
          console.log(`   ✅ Changes committed`)
        } else {
          console.log(`   ℹ️  No changes to commit`)
        }
      }

      successCount++
    } else {
      console.log(`   [DRY RUN] Would sync ${projectName}`)
    }
  } catch (error) {
    console.error(`   ❌ Error syncing ${projectName}:`, error.message)
    errorCount++
  }
})

// Summary
console.log('\n' + '='.repeat(50))
console.log('📊 Sync Summary')
console.log('='.repeat(50))
console.log(`✅ Synced:  ${successCount} projects`)
console.log(`⏭️  Skipped: ${skipCount} projects`)
console.log(`❌ Errors:  ${errorCount} projects`)

if (dryRun) {
  console.log('\n💡 Run without --dry-run to actually sync files')
}

if (successCount > 0 && !autoCommit && !dryRun) {
  console.log('\n📝 Next steps:')
  console.log('   1. Review changes in each project')
  console.log('   2. Test: npm run build && npm run test')
  console.log('   3. Commit manually, or re-run with --auto-commit')
}

if (autoCommit && successCount > 0) {
  console.log('\n✨ All projects synced and committed!')
}

process.exit(errorCount > 0 ? 1 : 0)
