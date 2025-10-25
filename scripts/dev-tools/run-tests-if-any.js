#!/usr/bin/env node
const { execSync } = require('node:child_process')

function list(patterns) {
  const args = ['ls-files', ...patterns]
  const out = execSync(['git', ...args].join(' '), { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
  return out
}

try {
  const files = list(['"src/**/*.test.ts"', '"src/**/__tests__/**/*.ts"'])
  if (files.length === 0) {
    console.log('No tests found')
    process.exit(0)
  }
  const cmd = `npx tsx --test ${files.map(f => `'${f}'`).join(' ')}`
  execSync(cmd, { stdio: 'inherit' })
} catch (e) {
  console.error(e.message || e)
  process.exit(1)
}
