import path from 'path'
import { availableParallelism } from 'node:os'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const processTestFiles = [
  'shared/utils/date-time.test.ts',
  'shared/services/storage/browser-session-storage.test.ts',
  'modules/events/components/pass-qr.test.tsx',
]

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    maxWorkers: Math.min(4, availableParallelism()),
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom',
    dir: './src',
    projects: [
      {
        test: {
          name: 'unit',
          pool: 'vmForks',
          vmMemoryLimit: '768MB',
          exclude: [...configDefaults.exclude, ...processTestFiles],
        },
      },
      {
        test: {
          name: 'process',
          pool: 'forks',
          include: processTestFiles,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/app/layout.tsx', '**/*.test.{ts,tsx}', 'src/lib/utils.ts', 'src/components/ui/card/index.ts', 'src/components/ui/select.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
