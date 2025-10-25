Clean build artifacts and restart the development server.

Useful when experiencing build cache issues or stale module problems.

Execute:

```bash
rm -rf .next
rm -rf node_modules/.cache
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
npm run dev
```

This:

1. Removes Next.js build cache
2. Removes node_modules cache
3. Kills any process on port 3000
4. Starts fresh dev server

Inform user: "🧹 Cleaned caches and restarted dev server at http://localhost:3000"
