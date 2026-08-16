import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      'yohaku-mobile-overlay': path.resolve(
        import.meta.dirname,
        'src/site-overlay.stub.ts',
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
