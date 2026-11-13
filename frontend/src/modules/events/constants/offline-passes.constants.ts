import { HOUR_MS, MINUTE_MS } from "@/shared/constants/date-time.constants";

export const OFFLINE_PASSES_KEY_PREFIX = "offline-passes:";
export const OFFLINE_QR_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
export const OFFLINE_PASSES_SNAPSHOT_QUERY_KEY = "offline-passes-snapshot";
export const OFFLINE_PASSES_STALE_AFTER_MS = 24 * HOUR_MS;
export const OFFLINE_PASSES_CLOCK_INTERVAL_MS = MINUTE_MS;
export const OFFLINE_PASSES_LOCALE = "es-BO";

export const OFFLINE_PASSES_TEXTS = {
  offlineBanner: "Estás viendo tus pases guardados sin conexión",
  failedRefreshBanner: "No se pudieron actualizar tus pases. Estás viendo la copia guardada",
  lastUpdated: "Última actualización:",
  staleNotice: "La copia tiene más de 24 horas. Conéctate a Internet para actualizarla.",
  availableOffline: "Disponible sin conexión",
  noCopyTitle: "No hay pases guardados en este dispositivo.",
  noCopyDescription: "Conéctate a Internet para cargarlos.",
  requiresConnection: "Requiere conexión a Internet",
  retry: "Reintentar",
} as const;
