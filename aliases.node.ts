import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

type AliasEntry = { find: string | RegExp; replacement: string }

type TsconfigPaths = {
  compilerOptions?: { paths?: Record<string, string[]> }
}

/**
 * Module aliases for Vite / Vitest / Storybook, derived from the `paths` map in
 * `tsconfig.paths.json`.
 *
 * That file is the single source of truth. Previously the bundler read a
 * hand-maintained `ROUTE_ALIASES` array while TypeScript read `paths`, and the
 * two drifted — which is how `@genealogy`, `@router`, `@main`, and `@test`
 * outlived the directories they pointed at. Deriving one from the other means a
 * stale alias can only exist in one place, where `tsc` will notice it.
 */
export function tsconfigPathAliases(): AliasEntry[] {
  const raw = fs.readFileSync(path.join(rootDir, 'tsconfig.paths.json'), 'utf8')
  const paths = (JSON.parse(raw) as TsconfigPaths).compilerOptions?.paths

  if (!paths || Object.keys(paths).length === 0) {
    throw new Error('tsconfig.paths.json declares no compilerOptions.paths — module aliases would be empty')
  }

  return Object.entries(paths).map(([specifier, targets]) => {
    const target = targets[0]
    if (!target) {
      throw new Error(`tsconfig.paths.json: "${specifier}" has no target path`)
    }

    // Wildcard form, e.g. "@api/*": ["src/api/*"]. Anchor the match so a
    // package named "@apifoo" can't be captured by the "@api" alias.
    if (specifier.endsWith('/*')) {
      const prefix = specifier.slice(0, -1) // "@api/*" -> "@api/"
      const targetDir = target.slice(0, -2) // "src/api/*" -> "src/api"
      // Keep the trailing separator: the regex consumes "@api/", so the
      // replacement must supply the "/" back or "@api/httpClient" resolves to
      // "src/apihttpClient".
      return {
        find: new RegExp(`^${escapeRegExp(prefix)}`),
        replacement: `${path.resolve(rootDir, targetDir)}${path.sep}`,
      }
    }

    // Exact form, e.g. "@types": ["src/types/index.ts"].
    return {
      find: new RegExp(`^${escapeRegExp(specifier)}$`),
      replacement: path.resolve(rootDir, target),
    }
  })
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
