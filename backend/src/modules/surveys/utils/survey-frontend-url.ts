const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

export function frontendBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const configured = env.FRONTEND_URL?.trim();
  const fromCors = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .find((origin) => origin.length > 0);
  return (configured || fromCors || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
}

export function buildSurveyFrontendUrl(path: string): string {
  return `${frontendBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export function formatSurveyClosureDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}.`;
}
