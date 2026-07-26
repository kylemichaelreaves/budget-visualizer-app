import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'
import type { StorybookConfig } from 'storybook-solidjs-vite'
import { tsconfigPathAliases } from '../aliases.node.ts'

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
  /**
   * `./public` carries mockServiceWorker.js, which msw-storybook-addon needs
   * served from the origin root. It deliberately does NOT live in the app's
   * `../public`: everything there is copied into `dist/`, which meant the
   * production build published a request-interception service worker at the
   * site root even though MSW is a Storybook-only dependency.
   */
  staticDirs: ['../public', './public'],
  viteFinal: async (c) =>
    mergeConfig(c, {
      plugins: [tailwindcss()],
      resolve: {
        alias: tsconfigPathAliases(),
      },
    }),
}

export default config
