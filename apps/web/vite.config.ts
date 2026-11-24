import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import {
  defaultClientConditions,
  defineConfig,
  type Plugin,
} from 'vite'

function applicationFallbacks(): Plugin {
  const rewrite = (
    request: { url?: string },
    _response: unknown,
    next: () => void,
  ) => {
    const pathname = request.url?.split('?')[0]

    if (
      pathname?.startsWith('/controller/') &&
      pathname !== '/controller/index.html'
    ) {
      request.url = '/controller/index.html'
    } else if (
      pathname?.startsWith('/console/') &&
      pathname !== '/console/index.html'
    ) {
      request.url = '/console/index.html'
    } else if (
      pathname?.startsWith('/dev/') &&
      pathname !== '/dev/index.html'
    ) {
      request.url = '/dev/index.html'
    }

    next()
  }

  return {
    name: 'application-fallbacks',

    configureServer(server) {
      server.middlewares.use(rewrite)
    },

    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

export default defineConfig({
  plugins: [
    applicationFallbacks(),
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
    conditions: ['source', ...defaultClientConditions],
  },

  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        console: resolve(import.meta.dirname, 'console/index.html'),
        controller: resolve(import.meta.dirname, 'controller/index.html'),
        dev: resolve(import.meta.dirname, 'dev/index.html'),
      },
    },
  },
})