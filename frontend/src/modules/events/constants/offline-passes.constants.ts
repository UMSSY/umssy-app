export const OFFLINE_PASSES_KEY_PREFIX = "offline-passes:";
export const OFFLINE_QR_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
export const OFFLINE_PASSES_SNAPSHOT_QUERY_KEY = "offline-passes-snapshot";
export const OFFLINE_PASSES_LOCALE = "es-BO";

export const OFFLINE_PASSES_TEXTS = {
  offlineBanner: "Sin conexión. Estás viendo tus pases guardados.",
  failedRefreshBanner: "No se pudieron actualizar tus pases. Estás viendo tus pases guardados.",
  lastUpdated: "Última actualización:",
  availableOffline: "Disponible sin conexión",
  noCopyTitle: "No hay pases guardados en este dispositivo.",
  noCopyDescription: "Conéctate a Internet para cargarlos.",
  requiresConnection: "Requiere conexión a Internet",
  retry: "Reintentar",
} as const;
