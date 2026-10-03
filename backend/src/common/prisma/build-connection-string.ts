const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

export function buildDatabaseConnectionString(
  purpose: 'runtime' | 'migrations' = 'runtime',
): string {
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

  const baseUrl = `postgresql://${user}:${password}@${host}:${port}/${name}`;

  return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
}
