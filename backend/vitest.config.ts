import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    env: {
      VAPID_SUBJECT: 'mailto:soporte@umssy.com',
      VAPID_PUBLIC_KEY:
        'BEZ8wdcbxKrsApxDH7oAlMFpNsjQMzQw0zcg059G6t5rSMUL7_wAVwAcatr8UHKYaTZHJOXTHHp7KvIAdkWOi_c',
      VAPID_PRIVATE_KEY: 'fuc5SV1vkbN7h3idj8Nsg8W6uqf7zDYhOyZ8GbXz3Zk',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        'src/**/*.interface.ts',
        'src/**/*.dto.ts',
        'src/**/*.entity.ts',
        'src/prisma/*',
        'src/**/*seed*.ts',
        'src/common/database/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});
