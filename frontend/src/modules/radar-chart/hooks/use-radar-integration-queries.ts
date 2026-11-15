'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/services/api-client';
import { radarIntegrationApi } from '../services/radar-integration.service';
import {
  clearRadarReviewOperationId,
  getRadarReviewOperationId,
  listRadarReviewOperations,
} from '../services/radar-review-idempotency';
import type {
  RadarReviewDecision,
  RadarReviewKind,
} from '../services/radar-integration.service';

export const radarQueryKeys = {
  all: ['radar-integration'] as const,
  reviews: () => [...radarQueryKeys.all, 'reviews'] as const,
  notifications: () => [...radarQueryKeys.all, 'notifications'] as const,
};

export function useRadarReviewOperationRecovery() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...radarQueryKeys.all, 'operation-recovery'],
    queryFn: async () => {
      const operations = await listRadarReviewOperations();
      let recovered = 0;

      for (const operation of operations) {
        try {
          const result = await radarIntegrationApi.operationStatus(
            operation.operationId,
          );

          if (
            result.operationId !== operation.operationId ||
            result.status !== 'completed' ||
            result.kind !== operation.kind ||
            result.targetId !== operation.targetId ||
            result.decision !== operation.decision
          ) continue;

          await clearRadarReviewOperationId(
            operation.kind,
            operation.targetId,
            operation.decision,
            operation.operationId,
          );
          recovered++;
        } catch {
          // Se conserva la operación si aún no está confirmada o hay un error.
        }
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
    mutationFn: (id: string) =>
      radarIntegrationApi.openNotification(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: radarQueryKeys.notifications(),
      });
    },
  });

  return { openNotification };
}

interface ReviewDecisionVariables {
  kind: RadarReviewKind;
  id: string;
  decision: RadarReviewDecision;
}

export function useRadarReviewMutations() {
  const queryClient = useQueryClient();

  const decision = useMutation({
    mutationFn: async ({
      kind,
      id,
      decision: action,
    }: ReviewDecisionVariables) => {
      const operationId = await getRadarReviewOperationId(
        kind,
        id,
        action,
      );

      const validateResult = (
        result: Awaited<
          ReturnType<typeof radarIntegrationApi.operationStatus>
        >,
      ) => {
        if (
          result.operationId !== operationId ||
          result.status !== 'completed' ||
          result.kind !== kind ||
          result.targetId !== id ||
          result.decision !== action
        ) {
          throw new Error(
            'El resultado recuperado no coincide con la operacion solicitada.',
          );
        }

        return result;
      };

      try {
        const saved = await radarIntegrationApi.operationStatus(operationId);
        const validated = validateResult(saved);

        await clearRadarReviewOperationId(
          kind,
          id,
          action,
          operationId,
        );

        return validated;
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message ===
            'El resultado recuperado no coincide con la operacion solicitada.'
        ) {
          throw error;
        }

        if (!isApiError(error) || error.response?.status !== 404) {
          throw error;
        }
      }

      const result = validateResult(
        await radarIntegrationApi.decision(
          kind,
          id,
          operationId,
          action,
        ),
      );

      await clearRadarReviewOperationId(
        kind,
        id,
        action,
        operationId,
      );

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: radarQueryKeys.reviews(),
      });
    },
  });

  const reprocess = useMutation({
    mutationFn: (id: string) =>
      radarIntegrationApi.adminReprocessCv(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: radarQueryKeys.reviews(),
      });
    },
  });

  return { decision, reprocess };
}
