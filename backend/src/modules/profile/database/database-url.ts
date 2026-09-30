export interface DatabaseEnv {
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
}

export function buildDatabaseUrl(env: DatabaseEnv): string {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = env;
  const user = encodeURIComponent(DB_USER ?? '');
  const password = encodeURIComponent(DB_PASSWORD ?? '');

  return `postgresql://${user}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}
