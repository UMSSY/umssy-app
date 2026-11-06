const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

// Origen del frontend para los enlaces de los correos: FRONTEND_URL o, si no existe, el primer CORS_ORIGIN
export function frontendBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const configured = env.FRONTEND_URL?.trim();
  const fromCors = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .find((origin) => origin.length > 0);
  return (configured || fromCors || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
}

export function buildFrontendUrl(path: string, query: Record<string, string> = {}): string {
  const url = new URL(path, `${frontendBaseUrl()}/`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url.toString();
}