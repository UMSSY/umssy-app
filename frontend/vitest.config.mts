import path from 'path'
import { availableParallelism } from 'node:os'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    maxWorkers: Math.min(4, availableParallelism()),
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/modules/reports/views/rejected-users-report-view.test.tsx',
      'src/modules/reports/views/report-history-view.test.tsx',
      'src/modules/reports/views/registered-users-report-view.test.tsx',
      'src/modules/work-experience/views/work-experience-flow.test.tsx',
      'src/modules/work-experience/views/work-experience-view.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/app/layout.tsx',
        '**/*.test.{ts,tsx}',
        'src/lib/utils.ts',
        'src/components/ui/card/index.ts',
        'src/components/ui/select.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})