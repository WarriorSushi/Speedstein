import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
      ],
    },
    // Note: For full Cloudflare Workers compatibility, use @cloudflare/vitest-pool-workers
    // or run tests with wrangler dev --test-scheduled
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@speedstein/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@speedstein/database': path.resolve(__dirname, '../../packages/database/src'),
    },
  },
})
