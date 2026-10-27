import { defineConfig, loadEnv } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const lan = mode === 'lan'
  const certPath = (file: string) => fileURLToPath(new URL(`./.cert/${file}`, import.meta.url))
  if (lan && !env.VITE_PHONE_ORIGIN) throw new Error('Run npm run setup:lan first to configure the PC address and trusted HTTPS certificate.')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: lan ? '0.0.0.0' : 'localhost',
      port: 5173,
      strictPort: true,
      https: lan ? { key: readFileSync(certPath('lan-key.pem')), cert: readFileSync(certPath('lan.pem')) } : undefined,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
