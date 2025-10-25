Run pre-commit checks without actually committing.

Useful before requesting code review or deployment approval.

Execute:

```bash
npm run type-check
npm run lint
npm run format:check
```

Show results for each:

- ✅ TypeScript: No errors
- ✅ ESLint: No issues
- ✅ Prettier: All files formatted

Or:

- ❌ TypeScript: X errors found
- ❌ ESLint: Y issues found
- ❌ Prettier: Z files need formatting

If issues found, offer to:

- Fix formatting: `npm run format`
- Fix eslint: `npm run lint:fix`
- Help debug TypeScript errors

**Note**: This is what pre-commit hooks will run automatically, but running manually gives you a preview.
