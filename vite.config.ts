import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import solid from 'vite-plugin-solid'
import { tsconfigPathAliases } from './aliases.node'

const LAMBDA_DEV_URL = 'http://127.0.0.1:3000'
const API_GATEWAY_FALLBACK = 'https://a4j9exec83.execute-api.us-east-1.amazonaws.com/Prod'

/**
 * Presigned CSV upload target for `connect-src`.
 *
 * resourceQuerier's `createCsvImport` signs a `PutObjectCommand` against the
 * bucket named by SSM `/dev/resourceQuerier/s3/transactionsBucket` — currently
 * `transactions-bucket` in `us-east-1`. AWS SDK v3 emits virtual-hosted-style
 * URLs for DNS-compatible bucket names; both the region-qualified and the legacy
 * bare form are allowed so an SDK or endpoint-config change doesn't break
 * uploads. Path-style (`s3.<region>.amazonaws.com/<bucket>`) is deliberately
 * excluded — it would allowlist every bucket on that endpoint.
 *
 * If the bucket or region changes, this must change with it.
 */
const CSV_UPLOAD_ORIGINS = [
  'https://transactions-bucket.s3.us-east-1.amazonaws.com',
  'https://transactions-bucket.s3.amazonaws.com',
]

/** Origin only — CSP source expressions match on scheme/host/port, not path. */
function originOf(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

/**
 * Directives injected into the built `index.html`.
 *
 * `script-src 'self'` blocks injected inline script and foreign script hosts.
 * `connect-src` is the other half of the same goal: the session bearer token
 * lives in localStorage, so restricting where the page may send data is what
 * stops an injected script from exfiltrating it.
 *
 * The `connect-src` allowlist is derived from the *same* `VITE_APIGATEWAY_URL`
 * that `src/constants.ts` builds the client's `baseURL` from, read through
 * `loadEnv` so `.env` files are honoured exactly as the client sees them. That
 * shared origin is deliberate: the policy cannot drift from the URL the app
 * actually calls. When the variable is unset the client falls back to a relative
 * `/api/v1`, which `'self'` already covers.
 *
 * Still no `default-src`: it would inherit into directives this app has not been
 * audited against (`img-src`, `font-src`, `style-src` — d3 sets inline styles),
 * and a miss there fails closed in production only.
 *
 * `frame-ancestors` remains absent because it is ignored when CSP is delivered
 * via meta tag. It, HSTS, and a full `default-src` policy belong on the
 * CloudFront response headers, where `Content-Security-Policy-Report-Only` can
 * validate a stricter policy before enforcing it.
 */
function cspDirectives(apiGatewayUrl: string): string {
  const apiOrigin = apiGatewayUrl ? originOf(apiGatewayUrl) : null
  const connectSrc = ["'self'", ...(apiOrigin ? [apiOrigin] : []), ...CSV_UPLOAD_ORIGINS]

  return [
    "script-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
  ].join('; ')
}

const CHARSET_META = /<meta\s+charset=["']?[^">]*["']?\s*\/?>/i

/**
 * Build-only: the dev server injects an inline HMR preamble and opens a
 * websocket, both of which `script-src 'self'` / `connect-src` would block.
 */
function cspMetaTags(apiGatewayUrl: string): Plugin {
  return {
    name: 'csp-meta-tags',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => {
        const charset = CHARSET_META.exec(html)
        if (!charset) {
          throw new Error('index.html has no <meta charset> to anchor the CSP meta after')
        }

        // Insert immediately after <meta charset> — before the module script, so
        // the policy is in force when it loads, but after the charset
        // declaration, which the HTML spec wants first in <head>.
        const meta =
          `\n    <meta http-equiv="Content-Security-Policy" content="${cspDirectives(apiGatewayUrl)}" />` +
          `\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`

        return html.replace(charset[0], `${charset[0]}${meta}`)
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  // Third arg '' loads every var, not just the VITE_-prefixed ones, so
  // VITE_PROXY_LOCAL_LAMBDA set in a `.env` file works the same as in the shell.
  // Plain `process.env` would miss `.env` entirely — and the client *does* read
  // it via import.meta.env, so the CSP would allowlist the wrong origin.
  const env = loadEnv(mode, process.cwd(), '')

  const apiGatewayUrl = env.VITE_APIGATEWAY_URL ?? ''
  /** Dev proxy needs a concrete target even when the env var is absent. */
  const proxyTarget = apiGatewayUrl || API_GATEWAY_FALLBACK
  const apiV1Target = env.VITE_PROXY_LOCAL_LAMBDA === '1' ? LAMBDA_DEV_URL : proxyTarget

  return {
    plugins: [tailwindcss(), solid(), cspMetaTags(apiGatewayUrl)],
    server: {
      host: 'localhost',
      port: 5173,
      proxy: {
        '/api/v1': {
          target: apiV1Target,
          changeOrigin: true,
        },
        // Fallback when local Lambda was used but died: baseURL becomes /api/gateway; paths must map to .../api/v1/*
        '/api/gateway': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/gateway/, '/api/v1'),
        },
      },
    },
    resolve: {
      alias: tsconfigPathAliases(),
    },
  }
})
