'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/contexts/auth-context';
import { verificationApi } from '../services/document-verification.service';
export function useDocumentVerifications() {
  const { currentUserId } = useAuth();
  return useQuery({
    queryKey: ['documents', 'verifications', currentUserId],
    enabled: Boolean(currentUserId),
    queryFn: () => verificationApi.list(),
    refetchInterval: (q) =>
      q.state.data?.some((d) => d.active && !d.synced) ? 1500 : 15000,
    refetchOnReconnect: 'always',
  });
}
