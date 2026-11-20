export function getChatHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const value = error as {
    response?: { status?: unknown };
    status?: unknown;
    statusCode?: unknown;
  };

  const status =
    value.response?.status ?? value.status ?? value.statusCode;

  return typeof status === "number" ? status : undefined;
}

export function getChatActionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const status = getChatHttpStatus(error);

  if (status === 401) {
    return "Tu sesión no es válida o ha expirado. Inicia sesión nuevamente para continuar.";
  }

  if (status === 403) {
    return "La comunicación está restringida. No tienes permiso para completar esta acción.";
  }

  return fallback;
}