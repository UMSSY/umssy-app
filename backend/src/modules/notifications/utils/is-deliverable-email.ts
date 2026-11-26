import {
  RESERVED_EMAIL_DOMAINS,
  RESERVED_EMAIL_TOP_LEVEL_DOMAINS,
} from '../constants/reserved-email-domains.constants.js';

export function isDeliverableEmail(email: string): boolean {
  if (!email.includes('@')) return false;

  const domain = email
    .trim()
    .toLowerCase()
    .split('@')
    .at(-1)
    ?.replace(/\.$/, '');
  if (!domain) return false;

  const topLevelDomain = domain.split('.').at(-1) ?? '';
  if (RESERVED_EMAIL_TOP_LEVEL_DOMAINS.has(topLevelDomain)) return false;

  return ![...RESERVED_EMAIL_DOMAINS].some(
    (reserved) => domain === reserved || domain.endsWith(`.${reserved}`),
  );
}