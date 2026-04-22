import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'
import type { StorybookConfig } from 'storybook-solidjs-vite'
import { ROUTE_ALIASES } from '../constants.node.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  /**
   * Story index generation (sidebar, `storybook dev`, preview URL) can fail when a
   * `*.stories.*` file exposes syntax the indexer cannot parse, logging
   * “Unable to index files … Could not parse import/exports with acorn”.
   * Keep CSF files compatible with Storybook’s indexer; if indexing breaks, simplify
   * the affected story’s top-level syntax rather than assuming one pattern fits all files.
   */
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-themes', 'msw-storybook-addon', '@storybook/addon-mcp'],
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
