
import { useQuery } from '@tanstack/react-query';

import { getAcceptedConnectionRequests } from '../services/connection-request-api';

export const acceptedConnectionsQueryKey = [
  'chat',
  'connection-requests',
  'accepted',
] as const;

export function useAcceptedConnections() {
  return useQuery({
    queryKey: acceptedConnectionsQueryKey,
    queryFn: getAcceptedConnectionRequests,
    staleTime: 30_000,
  });
}
