'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRegistrationSession } from '@/modules/registrations';
import { prepareOfflineShell } from '@/shared/services/service-worker/prepare-offline-shell';
import { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from '../constants/offline-passes.constants';
import { prepareOfflinePasses } from '../services/prepare-offline-passes';
import { prepareOfflineEvents } from '../services/prepare-offline-events';
import { useOnlineStatus } from './use-online-status';

export function usePrepareOfflinePasses(allowed: boolean) {
  const token = useRegistrationSession();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const available =
    process.env.NODE_ENV === 'production' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator;
  const enabled = Boolean(allowed && token && available);
  const query = useQuery({
    queryKey: ['prepare-offline-passes', token],
    enabled: enabled && isOnline,
    refetchOnReconnect: 'always',
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!token) throw new Error('Inicia sesión para guardar tus pases.');
      await Promise.all([
        prepareOfflineShell(signal),
        prepareOfflinePasses(token, signal),
        prepareOfflineEvents(token, signal),
      ]);
      void queryClient.invalidateQueries({
        queryKey: [OFFLINE_PASSES_SNAPSHOT_QUERY_KEY, token],
      });
      return true;
    },
  });
  return { query, show: enabled && isOnline };
}
