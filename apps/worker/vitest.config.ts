import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@speedstein/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@speedstein/database': path.resolve(__dirname, '../../packages/database/src'),
    },
  },
})
