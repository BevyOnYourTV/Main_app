import { resolve } from 'node:path'
import { defaultClientConditions, defineConfig } from 'vite'

// A classic script: in a sandboxed iframe, module scripts would need CORS.
export default defineConfig({
  resolve: {
    // Read workspace packages from their sources (ADR-0002).
    conditions: ['source', ...defaultClientConditions],
  },
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/main.ts'),
      fileName: () => 'game.js',
      formats: ['iife'],
      name: 'testGame',
    },
    outDir: resolve(import.meta.dirname, '../../apps/web/public/games/test-game'),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
