import path from 'node:path'
import { fileURLToPath } from 'node:url'
import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'
import { ROUTE_ALIASES } from './constants.node'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: ROUTE_ALIASES.map((alias) => ({
      find: `@${alias}`,
      replacement: path.resolve(__dirname, `src/${alias}`),
    })),
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    setupFiles: ['./tests/setup/vitest-setup.ts'],
    pool: 'threads',
    css: true,
  },
})
