#!/usr/bin/env node

const { exec } = require('child_process')

console.log('Restarting development server...')

// Kill any existing processes on port 3000
exec('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', error => {
  if (error && !error.message.includes('No such process')) {
    console.log('Warning: Could not kill existing process on port 3000')
  }

  // Wait a moment for cleanup
  setTimeout(() => {
    console.log('Starting fresh development server on localhost:3000...')

    // Start the development server
    const devProcess = exec('npm run dev', { stdio: 'inherit' })

    devProcess.stdout?.on('data', data => {
      process.stdout.write(data)
    })

    devProcess.stderr?.on('data', data => {
      process.stderr.write(data)
    })

    devProcess.on('close', code => {
      console.log(`\nDevelopment server exited with code ${code}`)
    })

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\nStopping development server...')
      devProcess.kill('SIGINT')
      process.exit(0)
    })
  }, 1000)
})
