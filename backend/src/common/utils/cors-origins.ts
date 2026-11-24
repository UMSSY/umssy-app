export function parseCorsOrigins(
  value: string | undefined = process.env.CORS_ORIGIN,
): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const SOCKET_CORS_CONFIG = {
  origin: (
    requestOrigin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    const allowedOrigins = parseCorsOrigins();
    if (
      !requestOrigin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(requestOrigin)
    ) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por CORS'), false);
  },
  credentials: true,
};
