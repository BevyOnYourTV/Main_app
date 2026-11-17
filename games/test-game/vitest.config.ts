import { defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Read workspace packages from their sources (ADR-0002).
  resolve: {
    conditions: ['source', ...defaultServerConditions],
  },
  ssr: {
    resolve: {
      conditions: ['source', ...defaultServerConditions],
      externalConditions: ['source'],
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
