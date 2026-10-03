const REQUIRED_JWT_VARS = ['JWT_SECRET', 'JWT_EXPIRES_IN', 'JWT_ALGORITHM'] as const;

export function validateJwtEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = REQUIRED_JWT_VARS.filter((name) => !env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them in your .env file (see .env.example).',
    );
  }
}
