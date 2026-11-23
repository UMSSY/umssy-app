export { OFFLINE_PASSES_KEY_PREFIX } from '@/shared/constants/offline-passes.constants';
export { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from '@/shared/constants/offline-passes.constants';
export const OFFLINE_QR_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
export const OFFLINE_PASSES_LOCALE = 'es-BO';

export const OFFLINE_PASSES_TEXTS = {
  offlineBanner: 'Sin conexión. Estás viendo tus pases guardados.',
  failedRefreshBanner:
    'No se pudieron actualizar tus pases. Estás viendo tus pases guardados.',
  lastUpdated: 'Última actualización:',
  availableOffline: 'Disponible sin conexión',
  noCopyTitle: 'No hay pases guardados en este dispositivo.',
  noCopyDescription: 'Conéctate a Internet y abre un pase confirmado para guardarlo en este dispositivo.',
  requiresConnection: 'Requiere conexión a Internet',
  retry: 'Reintentar',
} as const;

export const MY_PASSES_ROUTE = '/events/my-passes';

export const OFFLINE_PASSES_ROUTE_TEXTS = {
  openMyPasses: 'Ir a Mis inscripciones',
} as const;
