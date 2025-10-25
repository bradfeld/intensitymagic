#!/usr/bin/env node

/**
 * Check if project is using latest dev-standards version
 * Usage: node ~/Code/dev-standards/scripts/check-version.js
 */

const fs = require('fs')
const path = require('path')

const DEV_STANDARDS_PATH = path.join(process.env.HOME, 'Code', 'dev-standards')
const PROJECT_VERSION_FILE = '.dev-standards-version'

// Get latest version from dev-standards
const latestVersionPath = path.join(
  DEV_STANDARDS_PATH,
  '.dev-standards-version'
)
const latestVersion = fs.existsSync(latestVersionPath)
  ? fs.readFileSync(latestVersionPath, 'utf8').trim()
  : 'unknown'

// Get current project version
const currentVersionPath = path.join(process.cwd(), PROJECT_VERSION_FILE)
const currentVersion = fs.existsSync(currentVersionPath)
  ? fs.readFileSync(currentVersionPath, 'utf8').trim()
  : 'not-installed'

console.log('\n📦 Dev Standards Version Check')
console.log('─────────────────────────────')
console.log(`Latest:  ${latestVersion}`)
console.log(`Current: ${currentVersion}`)

if (currentVersion === 'not-installed') {
  console.log('\n⚠️  Dev standards not installed in this project')
  console.log('\n💡 To install:')
  console.log(
    `   node ${DEV_STANDARDS_PATH}/scripts/sync-to-project.js ${process.cwd()}`
  )
  process.exit(1)
}

if (currentVersion !== latestVersion) {
  console.log('\n⚠️  Your project is using an outdated version!')
  console.log('\n💡 To update:')
  console.log(
    `   node ${DEV_STANDARDS_PATH}/scripts/sync-to-project.js ${process.cwd()}`
  )
  console.log('\n📋 Changelog:')
  console.log('   Review changes at: ~/Code/dev-standards/CHANGELOG.md')
  process.exit(1)
}

console.log('\n✅ Your project is up to date!')
process.exit(0)
