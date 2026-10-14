const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

export function buildDatabaseConnectionString(
  purpose: 'runtime' | 'migrations' = 'runtime',
): string {
  if (process.env.DATABASE_URL) {
    const connection = new URL(process.env.DATABASE_URL);
    if (purpose === 'migrations' && process.env.DB_SCHEMA) {
      connection.searchParams.set('schema', process.env.DB_SCHEMA);
    }
    return connection.toString();
  }
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const name = process.env.DB_NAME;

  const params: string[] = [];

  if (purpose === 'migrations' && process.env.DB_SCHEMA) {
    params.push(`schema=${encodeURIComponent(process.env.DB_SCHEMA)}`);
  }

  if (host && !LOCAL_HOSTS.has(host.toLowerCase())) {
    params.push(purpose === 'migrations' ? 'sslmode=require' : 'sslmode=no-verify');
  }

  const baseUrl = `postgresql://${encodeURIComponent(user ?? '')}:${encodeURIComponent(password ?? '')}@${host}:${port}/${encodeURIComponent(name ?? '')}`;

  return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
}
