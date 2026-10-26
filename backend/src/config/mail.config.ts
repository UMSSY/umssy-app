import { z } from 'zod';

const MAIL_CONFIG_SCHEMA = z.object({
  MAIL_TRANSPORT: z.enum(['console', 'smtp']).default('console'),
  MAIL_FROM_ADDRESS: z.email().default('no-reply@umssy.local'),
  MAIL_FROM_NAME: z.string().trim().min(1).default('UMSSY'),
  MAIL_REPLY_TO: z.union([z.email(), z.literal('')]).default(''),
  MAIL_LOGO_URL: z
    .union([z.url({ protocol: /^https$/ }), z.literal('')])
    .default('https://umssy.zer4c.dev/icons/umssy-logo-web.svg'),
  SMTP_HOST: z.string().trim().default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z
    .stringbool({ truthy: ['true'], falsy: ['false'] })
    .default(false),
  SMTP_REQUIRE_TLS: z
    .stringbool({ truthy: ['true'], falsy: ['false'] })
    .default(false),
  SMTP_USER: z.string().trim().default(''),
  SMTP_PASSWORD: z.string().default(''),
});

export function parseMailConfig(env: Record<string, unknown> = process.env) {
  const config = MAIL_CONFIG_SCHEMA.parse(env);
  if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASSWORD)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together.');
  }
  if (config.MAIL_TRANSPORT === 'smtp' && !config.SMTP_HOST) {
    throw new Error('SMTP_HOST is required for SMTP transport.');
  }
  if (env.NODE_ENV === 'production') {
    if (config.MAIL_TRANSPORT !== 'smtp') {
      throw new Error('Production requires MAIL_TRANSPORT=smtp.');
    }
    if (!env.MAIL_FROM_ADDRESS || config.MAIL_FROM_ADDRESS.endsWith('.local')) {
      throw new Error('Production requires a verified MAIL_FROM_ADDRESS.');
    }
    if (!env.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD) {
      throw new Error(
        'Production requires SMTP_HOST, SMTP_USER and SMTP_PASSWORD.',
      );
    }
    if (!config.SMTP_SECURE && !config.SMTP_REQUIRE_TLS) {
      throw new Error(
        'Production SMTP requires SMTP_SECURE=true or SMTP_REQUIRE_TLS=true.',
      );
    }
  }
  return config;
}
