import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'
import type { StorybookConfig } from 'storybook-solidjs-vite'
import { ROUTE_ALIASES } from '../constants.node.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', 'msw-storybook-addon', '@storybook/addon-mcp'],
  framework: 'storybook-solidjs-vite',
  staticDirs: ['../public'],
  viteFinal: async (c) =>
    mergeConfig(c, {
      plugins: [tailwindcss()],
      resolve: {
        alias: ROUTE_ALIASES.map((alias) => ({
          find: `@${alias}`,
          replacement: path.resolve(__dirname, '../src', alias),
        })),
      },
    }),
}

export default config
