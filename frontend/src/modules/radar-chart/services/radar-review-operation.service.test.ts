import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { radarIntegrationApi } from './radar-integration.service';
import {
  clearRadarReviewOperationId,
  getRadarReviewOperationId,
} from './radar-review-idempotency';
import { submitRadarReviewDecision } from './radar-review-operation.service';

vi.mock('./radar-review-idempotency', () => ({
  getRadarReviewOperationId: vi.fn(),
  clearRadarReviewOperationId: vi.fn(),
}));

describe('Recoverable review protocol', () => {
  const operation = {
    kind: 'skill' as const,
    id: 'skill-1',
    decision: 'approved' as const,
  };
  const result = {
    operationId: 'operation-1',
    status: 'completed' as const,
    kind: 'skill' as const,
    targetId: 'skill-1',
    decision: 'approved' as const,
    changed: true,
    userId: 'owner',
    completedAt: '2026-11-17T12:00:00Z',
  };
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.mocked(getRadarReviewOperationId).mockResolvedValue('operation-1');
    vi.spyOn(radarIntegrationApi, 'operationStatus').mockResolvedValue(result);
    vi.spyOn(radarIntegrationApi, 'decision').mockResolvedValue(result);
  });
  it('recovers a completed result without resending the decision', async () => {
    await expect(submitRadarReviewDecision(operation)).resolves.toEqual(result);
    expect(radarIntegrationApi.decision).not.toHaveBeenCalled();
    expect(clearRadarReviewOperationId).toHaveBeenCalledWith(
      'skill',
      'skill-1',
      'approved',
      'operation-1',
    );
  });
  it('sends only after a missing operation response', async () => {
    const error = new AxiosError('Missing');
    error.response = { status: 404 } as NonNullable<AxiosError['response']>;
    vi.mocked(radarIntegrationApi.operationStatus).mockRejectedValue(error);
    await submitRadarReviewDecision(operation);
    expect(radarIntegrationApi.decision).toHaveBeenCalledWith(
      'skill',
      'skill-1',
      'operation-1',
      'approved',
    );
  });
  it('retains intent on network failure without sending a new decision', async () => {
    vi.mocked(radarIntegrationApi.operationStatus).mockRejectedValue(
      new Error('Offline'),
    );
    await expect(submitRadarReviewDecision(operation)).rejects.toThrow(
      'Offline',
    );
    expect(radarIntegrationApi.decision).not.toHaveBeenCalled();
    expect(clearRadarReviewOperationId).not.toHaveBeenCalled();
  });
  it.each(['operationId', 'kind', 'targetId', 'decision', 'status'] as const)(
    'retains intent when recovered %s differs',
    async (field) => {
      vi.mocked(radarIntegrationApi.operationStatus).mockResolvedValue({
        ...result,
        [field]: 'different',
      });
      await expect(submitRadarReviewDecision(operation)).rejects.toThrow();
      expect(radarIntegrationApi.decision).not.toHaveBeenCalled();
      expect(clearRadarReviewOperationId).not.toHaveBeenCalled();
    },
  );
});
