import { buildDatabaseUrl } from './database-url.js';

describe('buildDatabaseUrl', () => {
  it('builds the PostgreSQL connection string from the environment', () => {
    const url = buildDatabaseUrl({
      DB_USER: 'user',
      DB_PASSWORD: 'p@ss:word',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'app_db',
    });

    expect(url).toBe('postgresql://user:p%40ss%3Aword@localhost:5432/app_db');
  });

  it('tolerates missing credentials', () => {
    expect(
      buildDatabaseUrl({ DB_HOST: 'db', DB_PORT: '1', DB_NAME: 'x' }),
    ).toBe('postgresql://:@db:1/x');
  });
});
