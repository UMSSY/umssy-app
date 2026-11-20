import { isApiError } from '@/shared/services/api-client';
import { radarIntegrationApi } from './radar-integration.service';
import {
  getRadarReviewOperationId,
  clearRadarReviewOperationId,
} from './radar-review-idempotency';
import type { ReviewDecisionVariables } from '../types/review-decision-variables.types';
import type { RadarReviewOperationResult } from '../types/radar-review-operation-result.types';
export async function recoverRadarReviewOperation(
  operation: ReviewDecisionVariables & { operationId: string },
) {
  const result =
    operation.kind === 'cv'
      ? await radarIntegrationApi.documentOperationStatus(operation.operationId)
      : await radarIntegrationApi.operationStatus(operation.operationId);
  return completeRadarReviewOperation(operation, result);
}
async function completeRadarReviewOperation(
  operation: ReviewDecisionVariables & { operationId: string },
  result: RadarReviewOperationResult,
) {
  if (
    result.operationId !== operation.operationId ||
    result.status !== 'completed' ||
    result.kind !== operation.kind ||
    result.targetId !== operation.id ||
    result.decision !== operation.decision
  )
    throw new Error(
      'El resultado recuperado no coincide con la decisi\u00f3n solicitada.',
    );
  await clearRadarReviewOperationId(
    operation.kind,
    operation.id,
    operation.decision,
    operation.operationId,
  );
  return result;
}
export async function submitRadarReviewDecision(
  operation: ReviewDecisionVariables,
) {
  const operationId = await getRadarReviewOperationId(
    operation.kind,
    operation.id,
    operation.decision,
  );
  const pending = { ...operation, operationId };
  try {
    return await recoverRadarReviewOperation(pending);
  } catch (error) {
    if (!isApiError(error) || error.response?.status !== 404) throw error;
  }
  const result =
    operation.kind === 'cv'
      ? await radarIntegrationApi.documentDecision(
          operation.id,
          operationId,
          operation.decision,
        )
      : await radarIntegrationApi.decision(
          operation.kind,
          operation.id,
          operationId,
          operation.decision,
        );
  return completeRadarReviewOperation(pending, result);
}
