'use client';

import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { radarIntegrationApi } from '../services/radar-integration.service';

export function useHistoricalRadar(snapshotId: string | null) {
  const session = getAccessToken();
  return useQuery({
    queryKey: ['radar-integration', 'snapshot', snapshotId, session],
    enabled: Boolean(snapshotId),
    queryFn: () => radarIntegrationApi.historical(snapshotId!),
    retry: false,
  });
}
