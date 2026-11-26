'use client';
import { DOCUMENT_VERIFICATIONS_QUERY_KEY } from '../constants/document-verification-query.constants';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/contexts/auth-context';
import { verificationApi } from '../services/document-verification.service';
export function useDocumentVerifications() {
  const { currentUserId } = useAuth();
  return useQuery({
    queryKey: [...DOCUMENT_VERIFICATIONS_QUERY_KEY, currentUserId],
    enabled: Boolean(currentUserId),
    queryFn: () => verificationApi.list(),
    refetchInterval: (q) =>
      q.state.data?.some((d) => d.active && !d.synced) ? 1500 : 15000,
    refetchOnReconnect: 'always',
  });
}
