'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isApiError } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { radarIntegrationApi } from '../sprint2-integration/radar-integration-api';
import { mapPublishedRadar } from '../mappers/radar-published.mapper';
import type { RadarBridgeView } from './types';

interface AxiosLikeError {
  isAxiosError?: boolean;
  response?: {
    status?: number;
    data?: {
      detail?: string;
      message?: string;
    };
  };
}

function resolveErrorMessage(err: unknown): string {
  const isAxios = isApiError(err) || (typeof err === 'object' && err !== null && ('isAxiosError' in err || 'response' in err));
  if (isAxios) {
    const axiosErr = err as AxiosLikeError;
    if (!axiosErr.response) {
      return 'No se pudo conectar con el servidor. Comprueba la conexión y vuelve a intentarlo.';
    }
    const status = axiosErr.response.status;
    if (status === 401) {
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    }
    if (status === 403) {
      return 'No tienes permisos para acceder a esta información.';
    }
    if (status === 409) {
      return (
        axiosErr.response.data?.detail ||
        axiosErr.response.data?.message ||
        'El cálculo de afinidad se encuentra en proceso. Se actualizará en breve.'
      );
    }
    if (status && status >= 500) {
      return 'Ocurrió un problema interno en el servicio de radar. Inténtalo más tarde.';
    }
  }
  if (err instanceof Error) {
    return `Error al procesar los datos del radar: ${err.message}`;
  }
  return 'Ocurrió un error inesperado al cargar el radar.';
}

export function useLiveRadar() {
  const [data, setData] = useState<RadarBridgeView | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variation, setVariation] = useState<number | null>(null);
  const lastSession = useRef<string | null>(null);
  const currentVersion = useRef(0);
  const inFlight = useRef<{ token: string | null; id: number } | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (lastSession.current !== token) {
      lastSession.current = token;
      currentVersion.current = 0;
      setData(null);
      setVariation(null);
      setError(null);
    }
    if (inFlight.current?.token === token) return;
    const id = ++requestId.current;
    inFlight.current = { token, id };
    const isCurrent = () => mounted.current && token === getAccessToken() && id === requestId.current;
    try {
      let stored = await radarIntegrationApi.me();
      if (!isCurrent()) return;
      if (stored.version > 0 && stored.sourceRevision === null && stored.processingStatus !== 'error') {
        // Publications created before revision tracking are upgraded once.
        // A failed upgrade is persisted by the API and uses the normal retry UI.
        try {
          const recalculated = await radarIntegrationApi.recalculate();
          stored = recalculated;
        } catch {
        }
      }
      if (!isCurrent()) return;
      if (stored.version < currentVersion.current) return;
      currentVersion.current = stored.version;
      // Skills, evidence and scores come from the same server publication.
      const published = mapPublishedRadar(stored);
      const status = stored.processingStatus === 'error'
        ? 'error'
        : stored.processingStatus === 'pending' || stored.hasPending ? 'pending' : 'ready';
      setData({
        ...published,
        status,
        processingStatus: stored.processingStatus,
        rubric: stored.rubricVersion,
        version: stored.version,
        updatedAt: stored.updatedAt,
      });
      setVariation(stored.variation);
      setError(status === 'error' ? 'No se pudo publicar la actualización. Se conserva el último radar válido.' : null);
    } catch (err: unknown) {
      if (isCurrent()) setError(resolveErrorMessage(err));
    } finally {
      if (inFlight.current?.id === id) inFlight.current = null;
      if (isCurrent()) setLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    const token = getAccessToken();
    setRetrying(true);
    try {
      await radarIntegrationApi.recalculate();
      if (mounted.current && token === getAccessToken()) await refresh();
    } catch (err: unknown) {
      if (mounted.current && token === getAccessToken()) setError(resolveErrorMessage(err));
    } finally {
      if (mounted.current) setRetrying(false);
    }
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(refresh);
    const timer = window.setInterval(() => { void refresh(); }, 1500);
    return () => { mounted.current = false; window.clearInterval(timer); };
  }, [refresh]);
  return { data, loading, error, variation, refresh, retry, retrying };
}
