'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { radarIntegrationApi } from '../services/radar-integration.service';

export const radarQueryKeys = {
  all: ['radar-integration'] as const,
  reviews: () => [...radarQueryKeys.all, 'reviews'] as const,
};

export function useRadarReviews() {
  return useQuery({
    queryKey: radarQueryKeys.reviews(),
    queryFn: radarIntegrationApi.reviews,
    refetchInterval: 30_000,
  });
}

export function useRadarReviewMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: radarQueryKeys.reviews() });
  const decision = useMutation({
    mutationFn: ({ kind, id, decision }: {
      kind: 'cv' | 'skill'; id: string; decision: 'approved' | 'rejected' | 'revoked';
    }) => radarIntegrationApi.decision(kind, id, decision),
    onSuccess: invalidate,
  });
  const reprocess = useMutation({
    mutationFn: (id: string) => radarIntegrationApi.adminReprocessCv(id),
    onSuccess: invalidate,
  });
  return { decision, reprocess };
}
