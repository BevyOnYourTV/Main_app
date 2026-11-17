import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defaultClientConditions } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
    // Read workspace packages from their sources (ADR-0002).
    conditions: ['source', ...defaultClientConditions],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
