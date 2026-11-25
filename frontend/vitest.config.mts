import path from 'path'
import { availableParallelism } from 'node:os'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const processTestFiles = [
  'shared/utils/date-time.test.ts',
  'shared/services/storage/browser-session-storage.test.ts',
  'modules/events/components/pass-qr.test.tsx',
]

const isCoverageShard = process.env.VITEST_COVERAGE_SHARD === '1'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    maxWorkers: Math.min(4, availableParallelism()),
    vmMemoryLimit: '768MB',
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom',
    dir: './src',
    projects: [
      {
        test: {
          name: 'unit',
          pool: 'vmForks',
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
      // Shards write coverage into blob reports. The merge enforces the suite-wide thresholds.
      reporter: isCoverageShard ? [] : ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/app/layout.tsx', '**/*.test.{ts,tsx}', 'src/lib/utils.ts', 'src/components/ui/card/index.ts', 'src/components/ui/select.tsx'],
      thresholds: isCoverageShard ? undefined : {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
