'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { radarIntegrationApi } from '../services/radar-integration.service';
import { listRadarReviewOperations } from '../services/radar-review-idempotency';
import {
  recoverRadarReviewOperation,
  submitRadarReviewDecision,
} from '../services/radar-review-operation.service';
import type { RadarReviewKind } from '../types/radar-review-kind.types';
import type { ReviewDecisionVariables } from '../types/review-decision-variables.types';

export const radarQueryKeys = {
  all: ['radar-integration'] as const,
  reviews: () => [...radarQueryKeys.all, 'reviews'] as const,
  notifications: () => [...radarQueryKeys.all, 'notifications'] as const,
};

export function useRadarReviewOperationRecovery(kind: RadarReviewKind) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...radarQueryKeys.all, 'operation-recovery', kind],
    queryFn: async () => {
      const operations = (await listRadarReviewOperations()).filter(
        (operation) => operation.kind === kind,
      );
      let recovered = 0;

      for (const operation of operations) {
        try {
          await recoverRadarReviewOperation({
            ...operation,
            id: operation.targetId,
          });
          recovered++;
        } catch {}
      }

      if (recovered > 0) {
        await queryClient.invalidateQueries({
          queryKey: radarQueryKeys.reviews(),
        });
        await queryClient.invalidateQueries({
          queryKey: ['radar-integration', 'document-reviews'],
        });
      }

      return recovered;
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useRadarReviews() {
  return useQuery({
    queryKey: radarQueryKeys.reviews(),
    queryFn: radarIntegrationApi.reviews,
    refetchInterval: 30_000,
    refetchOnReconnect: true,
  });
}

export function useRadarNotifications() {
  return useQuery({
    queryKey: radarQueryKeys.notifications(),
    queryFn: radarIntegrationApi.notifications,
    refetchInterval: 30_000,
  });
}

export function useRadarNotificationMutations() {
  const queryClient = useQueryClient();

  const openNotification = useMutation({
    mutationFn: (id: string) => radarIntegrationApi.openNotification(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: radarQueryKeys.notifications(),
      });
    },
  });

  return { openNotification };
}

export function useRadarReviewMutations() {
  const queryClient = useQueryClient();

  const decision = useMutation({
    mutationFn: (operation: ReviewDecisionVariables) =>
      submitRadarReviewDecision(operation),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: radarQueryKeys.reviews(),
      });
    },
  });

  const reprocess = useMutation({
    mutationFn: (id: string) => radarIntegrationApi.adminReprocessCv(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: radarQueryKeys.reviews(),
      });
    },
  });

  return { decision, reprocess };
}
