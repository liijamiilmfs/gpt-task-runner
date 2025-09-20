import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['test/vitest/setup.ts'],
    include: ['tools/dict_importer/tests/**/*.test.py', 'test/vitest/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'dist-test'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
