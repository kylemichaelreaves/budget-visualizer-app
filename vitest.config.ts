import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'
import { tsconfigPathAliases } from './aliases.node'

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: tsconfigPathAliases(),
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
