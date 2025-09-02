# Critical Dependencies - DO NOT CHANGE

## Tailwind CSS Version
**IMPORTANT**: This project uses Tailwind CSS v3. DO NOT upgrade to v4 without updating all configuration files.

### Current Setup:
- **Tailwind CSS**: v3.x (NOT v4)
- **PostCSS**: v8.x
- **Autoprefixer**: v10.x

### Key Files That Must Stay In Sync:
1. `tailwind.config.ts` - Tailwind v3 configuration
2. `postcss.config.mjs` - Must use `tailwindcss: {}` not `@tailwindcss/postcss`
3. `src/app/globals.css` - Must use `@tailwind` directives, not `@import "tailwindcss"`

### If Styles Break (Plain Text Appearance):
1. Check package.json for Tailwind version (should be ^3.x.x, not ^4.x.x)
2. Run: `npm uninstall tailwindcss @tailwindcss/postcss`
3. Run: `npm install -D tailwindcss@^3 postcss autoprefixer`
4. Clear Next.js cache: `rm -rf .next`
5. Restart: `npm run dev:all`

### Never Use These Commands:
- `npm update` (can break version locks)
- `npm install tailwindcss@latest` (will install v4)
- Any Tailwind v4 migration commands

### Safe Commands:
- `npm ci` (installs from package-lock.json)
- `npm install` (respects version ranges)

## Other Critical Dependencies:
- **Next.js**: 15.4.6 (App Router)
- **React**: 19.1.0
- **Convex**: ^1.25.4

## Version Lock Recommendation:
Consider using exact versions in package.json (remove ^ and ~) for critical dependencies to prevent accidental updates.