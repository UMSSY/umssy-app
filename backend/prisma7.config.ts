import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { buildDatabaseConnectionString } from './src/common/prisma/build-connection-string.js';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: buildDatabaseConnectionString('migrations'),
  },
});
