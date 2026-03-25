import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { ROUTE_ALIASES } from './constants.node'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const LAMBDA_DEV_URL = 'http://127.0.0.1:3000'
const API_GATEWAY_URL =
  process.env.VITE_APIGATEWAY_URL ?? 'https://a4j9exec83.execute-api.us-east-1.amazonaws.com/Prod'

/** In dev, proxy /api/v1 to API Gateway by default. Set VITE_PROXY_LOCAL_LAMBDA=1 to use 127.0.0.1:3000 instead. */
const apiV1Target =
  process.env.VITE_PROXY_LOCAL_LAMBDA === '1' ? LAMBDA_DEV_URL : API_GATEWAY_URL

export default defineConfig({
  plugins: [solid()],
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
    alias: ROUTE_ALIASES.map((alias) => ({
      find: `@${alias}`,
      replacement: path.resolve(__dirname, `src/${alias}`),
    })),
  },
})
