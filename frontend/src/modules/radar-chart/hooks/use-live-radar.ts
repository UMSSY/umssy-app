'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCookieSession } from '@/shared/hooks/use-cookie-session';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { hasCookieSession } from '@/shared/services/storage/cookie-session-state';
import { radarIntegrationApi } from '../services/radar-integration.service';
import { mapPublishedRadar } from '../mappers/radar-published.mapper';
import type { IntegrationRadar } from '../types/radar-integration.types';
import type { RadarBridgeView } from '../types/radar-bridge.types';

import { RADAR_PERSONAL_QUERY_KEY } from '../constants/radar-query-keys.constants';
export { RADAR_PERSONAL_QUERY_KEY } from '../constants/radar-query-keys.constants';

function readRadarSession(): string | null {
  return getAccessToken() ?? (hasCookieSession() ? 'cookie' : null);
}

export function useLiveRadar() {
  const queryClient = useQueryClient();
  const cookieSession = useCookieSession();
  const session = getAccessToken() ?? (cookieSession ? 'cookie' : null);

  const query = useQuery<IntegrationRadar>({
    queryKey: RADAR_PERSONAL_QUERY_KEY,
    enabled: Boolean(session),
    retry: false,
    queryFn: async () => {
      let published = await radarIntegrationApi.me();
      if (session !== readRadarSession())
        throw new Error('La sesión cambió durante la consulta.');

      if (
        published.version > 0 &&
        published.sourceRevision === null &&
        published.processingStatus !== 'error'
      ) {
        try {
          published = await radarIntegrationApi.recalculate();
        } catch {
          published = await radarIntegrationApi.me();
        }
      }
      if (session !== readRadarSession())
        throw new Error('La sesión cambió durante la consulta.');
      return published;
    },
    refetchInterval: (query) =>
      query.state.data?.processingStatus === 'pending' ||
      query.state.data?.hasPending
        ? 1500
        : false,
    structuralSharing: (previous, next) => {
      const previousRadar = previous as IntegrationRadar | undefined;
      const nextRadar = next as IntegrationRadar;

      return previousRadar && nextRadar.version < previousRadar.version
        ? previousRadar
        : nextRadar;
    },
  });

  const recalculate = useMutation({
    mutationFn: async () => {
      const updated = await radarIntegrationApi.recalculate();
      if (session !== readRadarSession())
        throw new Error('La sesión cambió durante el recálculo.');
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<IntegrationRadar>(
        RADAR_PERSONAL_QUERY_KEY,
        (previous) =>
          previous && previous.version > updated.version ? previous : updated,
      );
    },
  });

  const data = useMemo<RadarBridgeView | null>(() => {
    if (!query.data) return null;
    const published = mapPublishedRadar(query.data);
    const status: RadarBridgeView['status'] =
      query.data.processingStatus === 'error'
        ? 'error'
        : query.data.processingStatus === 'pending' || query.data.hasPending
          ? 'pending'
          : 'ready';
    return {
      ...published,
      status,
      processingStatus: query.data.processingStatus,
      rubric: query.data.rubricVersion,
      version: query.data.version,
      updatedAt: query.data.updatedAt,
    };
  }, [query.data]);

  const error = recalculate.isError
    ? 'La actualización no pudo completarse. Puedes volver a intentarlo.'
    : query.isError
      ? 'No se pudo actualizar el radar publicado. Comprueba la conexión y vuelve a intentarlo.'
      : query.data?.processingStatus === 'error'
        ? 'No se pudo publicar la actualización. Se conserva el último radar válido.'
        : null;

  const refresh = async (): Promise<void> => {
    await query.refetch();
  };
  const retry = async (): Promise<void> => {
    try {
      await recalculate.mutateAsync();
      await query.refetch();
    } catch {
      // El estado y el mensaje de error los conserva la mutación.
    }
  };

  return {
    data,
    loading: Boolean(session) && query.isPending,
    error,
    variation: query.data?.variation ?? null,
    previous: query.data?.previous ?? null,
    refresh,
    retry,
    retrying: recalculate.isPending,
  };
}
