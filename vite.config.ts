import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import solid from 'vite-plugin-solid'
import { tsconfigPathAliases } from './aliases.node'

/**
 * Directives injected into the built `index.html`.
 *
 * `script-src 'self'` is the one that matters: the session bearer token lives in
 * localStorage, so blocking injected inline script and foreign script hosts is
 * the main mitigation available to the client. The production bundle loads a
 * single external module and contains no inline script, so this costs nothing.
 *
 * Deliberately NO `default-src`. Restricting it would inherit into `connect-src`
 * and cut off both the API Gateway origin (cross-origin in prod, unlike dev
 * where the Vite proxy makes it same-origin) and the per-upload presigned S3
 * host, whose bucket/region cannot be known at build time. Getting that wrong
 * fails closed and silently breaks CSV import, so network egress is left
 * unrestricted here.
 *
 * `frame-ancestors` is intentionally absent: it is ignored when CSP is delivered
 * via meta tag. It, HSTS, and a full `default-src`/`connect-src` policy belong on
 * the CloudFront response headers, where `Content-Security-Policy-Report-Only`
 * is also available to validate a stricter policy before enforcing it.
 */
const CSP_DIRECTIVES = [
  "script-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
].join('; ')

/**
 * Build-only: the dev server injects an inline HMR preamble and opens a
 * websocket, both of which `script-src 'self'` would block.
 */
const CHARSET_META = /<meta\s+charset=["']?[^">]*["']?\s*\/?>/i

function cspMetaTags(): Plugin {
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
          `\n    <meta http-equiv="Content-Security-Policy" content="${CSP_DIRECTIVES}" />` +
          `\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`

        return html.replace(charset[0], `${charset[0]}${meta}`)
      },
    },
  }
}

const LAMBDA_DEV_URL = 'http://127.0.0.1:3000'
const API_GATEWAY_URL =
  process.env.VITE_APIGATEWAY_URL ?? 'https://a4j9exec83.execute-api.us-east-1.amazonaws.com/Prod'

/** In dev, proxy /api/v1 to API Gateway by default. Set VITE_PROXY_LOCAL_LAMBDA=1 to use 127.0.0.1:3000 instead. */
const apiV1Target = process.env.VITE_PROXY_LOCAL_LAMBDA === '1' ? LAMBDA_DEV_URL : API_GATEWAY_URL

export default defineConfig({
  plugins: [tailwindcss(), solid(), cspMetaTags()],
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
        target: API_GATEWAY_URL,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/gateway/, '/api/v1'),
      },
    },
  },
  resolve: {
    alias: tsconfigPathAliases(),
  },
})
