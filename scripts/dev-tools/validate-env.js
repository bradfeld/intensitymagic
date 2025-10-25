#!/usr/bin/env node

/**
 * Environment Variable Validation for MedicareMagic
 *
 * Validates that all required environment variables are properly configured
 * for local development and provides helpful setup guidance.
 */

const { config } = require('dotenv')
const path = require('path')

// Load environment from .env.local
config({ path: path.join(__dirname, '../.env.local') })

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function header(message) {
  console.log(`\n${colors.bold}${colors.blue}${message}${colors.reset}`)
}

// Environment variable categories
const REQUIRED_CORE = [
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    description: 'Clerk authentication (public key)',
  },
  {
    name: 'CLERK_SECRET_KEY',
    description: 'Clerk authentication (server secret)',
  },
  { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase database URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase public key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase admin key' },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API for Medicare recommendations',
  },
]

const REQUIRED_PRODUCTION = [
  {
    name: 'MARKETPLACE_API_KEY',
    description: 'CMS Marketplace API (Medicare plan data)',
  },
]

const OPTIONAL_APIS = [
  { name: 'PPL_API_KEY', description: 'Medicare PPL API (procedure costs)' },
  { name: 'PPL_AMA_LICENSE', description: 'AMA license for PPL API' },
  {
    name: 'LINEAR_TOKEN',
    description: 'Linear project management integration',
  },
  { name: 'SOCRATA_APP_TOKEN', description: 'CMS data.gov integration' },
]

const FEATURE_FLAGS = [
  {
    name: 'COSTS_USE_REAL',
    description: 'Enable real cost data (0/1)',
    default: '0',
  },
  {
    name: 'USE_REAL_FORMULARY',
    description: 'Enable real formulary data (0/1)',
    default: '0',
  },
  {
    name: 'ENABLE_TEST_MODE',
    description: 'Enable testing features (0/1)',
    default: '0',
  },
]

const LOCAL_DEVELOPMENT = [
  {
    name: 'SUPABASE_LOCAL_API_PORT',
    description: 'Local Supabase API port',
    default: '54340',
  },
  {
    name: 'SUPABASE_LOCAL_DB_PORT',
    description: 'Local Supabase DB port',
    default: '54341',
  },
  {
    name: 'SUPABASE_LOCAL_STUDIO_PORT',
    description: 'Local Supabase Studio port',
    default: '54342',
  },
]

function validateVariableGroup(variables, groupName, required = true) {
  header(`${groupName}`)

  let allValid = true
  let hasAny = false

  variables.forEach(({ name, description, default: defaultValue }) => {
    const value = process.env[name]
    const hasValue = value && value.trim() !== ''

    if (hasValue) {
      log('green', `✅ ${name}: Configured`)
      hasAny = true
    } else if (required) {
      log('red', `❌ ${name}: Missing - ${description}`)
      allValid = false
    } else if (defaultValue) {
      log(
        'yellow',
        `⚠️  ${name}: Using default "${defaultValue}" - ${description}`
      )
    } else {
      log('yellow', `⚠️  ${name}: Not configured - ${description}`)
    }
  })

  return { allValid, hasAny }
}

function main() {
  header('🔍 MedicareMagic Environment Variable Validation')

  // Validate core requirements
  const core = validateVariableGroup(
    REQUIRED_CORE,
    '🚨 REQUIRED: Core Functionality',
    true
  )

  // Check production APIs
  const production = validateVariableGroup(
    REQUIRED_PRODUCTION,
    '🏥 PRODUCTION: Medicare APIs',
    false
  )

  // Check optional APIs
  const optional = validateVariableGroup(
    OPTIONAL_APIS,
    '🔗 OPTIONAL: Additional Integrations',
    false
  )

  // Check feature flags
  const flags = validateVariableGroup(
    FEATURE_FLAGS,
    '🎛️  FEATURE FLAGS: Development Controls',
    false
  )

  // Check local development setup
  const local = validateVariableGroup(
    LOCAL_DEVELOPMENT,
    '🏠 LOCAL DEVELOPMENT: Docker Ports',
    false
  )

  header('📊 VALIDATION SUMMARY')

  if (core.allValid) {
    log('green', '✅ Core functionality: Ready for development')
  } else {
    log('red', '❌ Core functionality: Missing required variables')
    console.log(
      `\n${colors.red}❌ Setup incomplete. Please configure missing variables in .env.local${colors.reset}`
    )
    console.log(
      `${colors.blue}📖 See: env-template.txt for complete variable list${colors.reset}`
    )
    process.exit(1)
  }

  if (production.hasAny) {
    log(
      'green',
      '✅ Production APIs: Some configured (Medicare data available)'
    )
  } else {
    log('yellow', '⚠️  Production APIs: None configured (will use mock data)')
    console.log(
      `${colors.yellow}   To enable real Medicare data, configure MARKETPLACE_API_KEY${colors.reset}`
    )
  }

  if (optional.hasAny) {
    log('green', `✅ Optional integrations: Some configured`)
  } else {
    log('blue', '💡 Optional integrations: None configured (all optional)')
  }

  header('🎯 RECOMMENDATIONS')

  if (!production.hasAny) {
    console.log(`${colors.yellow}1. Get Medicare API access:${colors.reset}`)
    console.log(
      `   • Request key: https://developer.cms.gov/marketplace-api/key-request.html`
    )
    console.log(`   • Add MARKETPLACE_API_KEY to .env.local`)
  }

  if (!optional.hasAny) {
    console.log(
      `${colors.blue}2. Consider additional integrations:${colors.reset}`
    )
    console.log(`   • Linear token for project management automation`)
    console.log(`   • PPL API for real procedure cost data`)
  }

  console.log(
    `${colors.green}\n✅ Environment validation complete!${colors.reset}`
  )
  console.log(`${colors.blue}🚀 Ready to run: npm run dev${colors.reset}`)
}

main()
