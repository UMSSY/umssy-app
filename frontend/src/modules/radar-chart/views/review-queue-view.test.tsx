
import { cleanup, screen, waitFor } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { radarIntegrationApi } from '../services/radar-integration.service';
import { verificationApi } from '@/modules/documents/services/document-verification.service';
import type { DocumentVerification } from '@/modules/documents/types/document-verification.types';
import { ReviewQueueView } from './review-queue-view';

const { operationId, notFound } = vi.hoisted(() => ({
  operationId: '33333333-3333-4333-8333-333333333333',
  notFound: Object.assign(new Error('Not found'), {
    isAxiosError: true,
    response: { status: 404 },
  }),
}));

vi.mock('../services/radar-review-idempotency', () => ({
  getRadarReviewOperationId: vi.fn().mockResolvedValue(operationId),
  clearRadarReviewOperationId: vi.fn().mockResolvedValue(undefined),
}));

const operationResult = {
  operationId,
  status: 'completed' as const,
  kind: 'cv' as const,
  targetId: 'v1',
  decision: 'approved' as const,
  changed: true,
  userId: 'user-1',
  completedAt: '2026-11-15T00:00:00.000Z',
};

const row: DocumentVerification = {
  id: 'v1',
  sourceId: 'cv',
  sourceType: 'cv',
  filename: 'Curso.pdf',
  ownerName: 'Ana',
  mime: 'application/pdf',
  sizeBytes: 123,
  status: 'review',
  reason: 'Nombre distinto',
  confidence: 0.92,
  skills: [],
  createdAt: '2026-11-01',
  decidedAt: '2026-11-01',
  available: true,
  active: true,
  synced: true,
  noticeRead: false,
  publishedIds: [],
  radarVersion: null,
};

beforeEach(() => {
  vi.spyOn(radarIntegrationApi, 'reviews').mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('permite revisar un único documento con su motivo y confirmar la decisión', async () => {
  vi.spyOn(verificationApi, 'list').mockResolvedValue([row]);

  const status = vi
    .spyOn(radarIntegrationApi, 'documentOperationStatus')
    .mockRejectedValue(notFound);

  const decide = vi
    .spyOn(radarIntegrationApi, 'documentDecision')
    .mockResolvedValue(operationResult);

  const user = userEvent.setup();
  render(<ReviewQueueView />);

  await screen.findByText(/Nombre distinto/);

  await user.click(
    screen.getByRole('button', { name: 'Aprobar documento' }),
  );

  await user.click(screen.getByRole('button', { name: 'Cancelar' }));

  expect(decide).not.toHaveBeenCalled();

  await user.click(
    screen.getByRole('button', { name: 'Aprobar documento' }),
  );

  await user.click(screen.getByRole('button', { name: 'Confirmar' }));

  await waitFor(() => {
    expect(status).toHaveBeenCalledWith(operationId);
    expect(decide).toHaveBeenCalledWith(
      'v1',
      operationId,
      'approved',
    );
  });
}, 15000);

it('permite consultar aprobados y revocar desde el mismo panel', async () => {
  const list = vi
    .spyOn(verificationApi, 'list')
    .mockImplementation(async (_, filter) =>
      filter === 'approved' ? [{ ...row, status: 'approved' }] : [],
    );

  const user = userEvent.setup();
  render(<ReviewQueueView />);

  await screen.findByText('No hay documentos pendientes.');

  await user.click(screen.getByRole('button', { name: 'Aprobados' }));

  expect(
    await screen.findByRole('button', { name: 'Revocar aprobación' }),
  ).toBeEnabled();

  expect(list).toHaveBeenCalledWith(true, 'approved');
});
