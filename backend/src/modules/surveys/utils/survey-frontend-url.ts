import { formatBoliviaDateTime } from '../../../common/utils/date-time.js';

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

export function toAbsoluteSurveyUrl(actionUrl: string): string {
  return /^https?:\/\//i.test(actionUrl)
    ? actionUrl
    : buildSurveyFrontendUrl(actionUrl);
}

export function formatSurveyClosureDate(date: Date): string {
  return `${formatBoliviaDateTime(date)}.`;
}
