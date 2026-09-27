import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DB_SCHEMA } = process.env;

const databaseUrl = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}${DB_SCHEMA ? `?schema=${DB_SCHEMA}` : ''}`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
