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
    coverage: {
      provider: 'v8',
      // lcov is what SonarCloud reads (sonar.javascript.lcov.reportPaths); text keeps the
      // summary visible in CI logs. Without an explicit list the default reporters do not
      // include lcov, so `--coverage` would produce nothing Sonar can consume.
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx,vue}'],
      exclude: ['src/**/*.d.ts', 'src/main.ts', 'src/**/__mocks__/**'],
    },
  },
})
