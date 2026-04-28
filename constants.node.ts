// Node.js compatible constants (for vite.config.ts, vitest.config.ts, etc.)
// These constants don't rely on browser-specific APIs like import.meta.env
// (This file is re-exported from `src/constants.ts` — keep it free of `node:path`.)

export const ROUTE_ALIASES: string[] = [
  'api',
  'charts',
  'components',
  'composables',
  'constants',
  'main',
  'mocks',
  'shared',
  'stores',
  'test',
  'types',
  'router',
  'utils',
]
