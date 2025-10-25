/**
 * ESLint Configuration Template
 * ============================================================================
 * Next.js 15 + TypeScript ESLint configuration with strict rules
 *
 * Installation:
 * npm install -D eslint @eslint/eslintrc eslint-config-next
 *
 * Usage:
 * - Copy to eslint.config.mjs in project root
 * - Adjust rules based on team preferences
 * - Run: npm run lint
 */

import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  // Extend Next.js recommended configs
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    rules: {
      // ========================================================================
      // TypeScript Rules
      // ========================================================================

      // Warn on 'any' usage - prefer proper typing
      '@typescript-eslint/no-explicit-any': 'warn',

      // Warn on unused variables (ignore if prefixed with _)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Enforce consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      // Prevent floating promises
      '@typescript-eslint/no-floating-promises': 'error',

      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Can enable if desired

      // ========================================================================
      // React Rules
      // ========================================================================

      // Enforce React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Allow unescaped entities (like apostrophes in JSX)
      'react/no-unescaped-entities': 'off',

      // Enforce self-closing for components without children
      'react/self-closing-comp': 'warn',

      // Prevent missing React import (not needed in Next.js)
      'react/react-in-jsx-scope': 'off',

      // ========================================================================
      // Next.js Specific Rules
      // ========================================================================

      // Enforce next/image usage over <img>
      '@next/next/no-img-element': 'error',

      // Warn on inline scripts (CSP considerations)
      '@next/next/no-sync-scripts': 'warn',

      // Enforce proper Link usage
      '@next/next/no-html-link-for-pages': 'error',

      // ========================================================================
      // Code Quality Rules
      // ========================================================================

      // Enforce consistent brace style
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],

      // Enforce consistent spacing
      'comma-spacing': ['warn', { before: false, after: true }],
      'keyword-spacing': ['warn', { before: true, after: true }],
      'space-before-blocks': ['warn', 'always'],

      // Prefer const over let when possible
      'prefer-const': 'warn',

      // Disallow console.log in production
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Disallow unused imports
      'no-unused-imports': 'off', // Use @typescript-eslint/no-unused-vars instead

      // Enforce consistent quotes
      quotes: [
        'warn',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],

      // Enforce semicolons (or not - adjust based on preference)
      semi: ['warn', 'never'], // Change to 'always' if preferred

      // Disallow var usage
      'no-var': 'error',

      // Prefer template literals over string concatenation
      'prefer-template': 'warn',

      // Disallow magic numbers (can be too strict, adjust as needed)
      'no-magic-numbers': 'off',

      // ========================================================================
      // Import Organization (Optional - requires additional plugins)
      // ========================================================================
      // Uncomment if you install eslint-plugin-import
      // 'import/order': [
      //   'warn',
      //   {
      //     'groups': [
      //       'builtin',
      //       'external',
      //       'internal',
      //       'parent',
      //       'sibling',
      //       'index',
      //     ],
      //     'newlines-between': 'always',
      //     'alphabetize': { order: 'asc', caseInsensitive: true },
      //   },
      // ],
    },
  },

  // ========================================================================
  // File-specific Overrides
  // ========================================================================
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // Relax rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.config.js', '**/*.config.mjs', '**/*.config.ts'],
    rules: {
      // Allow CommonJS in config files
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]

export default eslintConfig

/**
 * USAGE NOTES:
 *
 * 1. Add scripts to package.json:
 *    "lint": "eslint .",
 *    "lint:fix": "eslint . --fix"
 *
 * 2. Configure VS Code (.vscode/settings.json):
 *    {
 *      "editor.codeActionsOnSave": {
 *        "source.fixAll.eslint": true
 *      },
 *      "eslint.validate": [
 *        "javascript",
 *        "javascriptreact",
 *        "typescript",
 *        "typescriptreact"
 *      ]
 *    }
 *
 * 3. Integrate with Husky (lint-staged):
 *    {
 *      "lint-staged": {
 *        "*.{js,jsx,ts,tsx}": "eslint --fix"
 *      }
 *    }
 */
