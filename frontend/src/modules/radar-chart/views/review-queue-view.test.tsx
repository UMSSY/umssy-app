import { cleanup, screen, waitFor } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { radarIntegrationApi } from '../services/radar-integration.service';
import { verificationApi, type DocumentVerification } from '@/modules/cv';
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
  listRadarReviewOperations: vi.fn().mockResolvedValue([]),
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
  expect(
    screen.queryByRole('heading', { name: 'Revisión de habilidades' }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Aprobar documento' }));

  await user.click(screen.getByRole('button', { name: 'Cancelar' }));

  expect(decide).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Aprobar documento' }));

  await user.click(screen.getByRole('button', { name: 'Confirmar' }));

  await waitFor(() => {
    expect(status).toHaveBeenCalledWith(operationId);
    expect(decide).toHaveBeenCalledWith('v1', operationId, 'approved');
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

it('only offers reprocessing for legacy documents and no approval actions for rejected versions', async () => {
  vi.spyOn(verificationApi, 'list').mockResolvedValue([
    { ...row, status: 'legacy', available: false },
    {
      ...row,
      id: 'rejected',
      filename: 'Rechazado.pdf',
      status: 'manual_rejected',
    },
  ]);
  const user = userEvent.setup();
  render(<ReviewQueueView />);
  expect(
    await screen.findByRole('button', { name: 'No está disponible' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Reprocesar archivo' }),
  ).toBeEnabled();
  expect(
    screen.queryByRole('button', { name: 'Aprobar documento' }),
  ).toBeNull();
  await user.click(screen.getByRole('button', { name: /Ana · Rechazado.pdf/ }));
  expect(
    screen.queryByRole('button', { name: 'Reprocesar archivo' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Revocar aprobación' }),
  ).toBeNull();
});

it('reports a stale decision and reloads the queue instead of showing false success', async () => {
  const list = vi.spyOn(verificationApi, 'list').mockResolvedValue([row]);
  vi.spyOn(radarIntegrationApi, 'documentOperationStatus').mockRejectedValue(
    notFound,
  );
  const decide = vi
    .spyOn(radarIntegrationApi, 'documentDecision')
    .mockRejectedValue(
      Object.assign(new Error('409 conflict'), {
        isAxiosError: true,
        response: { status: 409 },
      }),
    );
  const user = userEvent.setup();
  render(<ReviewQueueView />);
  await user.click(
    await screen.findByRole('button', { name: 'Aprobar documento' }),
  );
  await user.click(screen.getByRole('button', { name: 'Confirmar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No se pudo confirmar la decisión.',
  );
  await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  expect(decide).toHaveBeenCalledWith('v1', operationId, 'approved');
});

it('recovers a failed preview and releases its temporary URL after closing', async () => {
  vi.spyOn(verificationApi, 'list').mockResolvedValue([row]);
  const file = vi
    .spyOn(verificationApi, 'file')
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValue(new Blob(['pdf']));
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:review');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const user = userEvent.setup();
  render(<ReviewQueueView />);
  await user.click(
    await screen.findByRole('button', { name: 'Visualizar respaldo' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'El respaldo no está disponible.',
  );
  await user.click(screen.getByRole('button', { name: 'Visualizar respaldo' }));
  expect(await screen.findByTitle('Curso.pdf')).toHaveAttribute(
    'src',
    'blob:review',
  );
  expect(file).toHaveBeenCalledWith('v1', true);
  await user.click(screen.getByRole('button', { name: 'Cerrar vista previa' }));
  await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:review'));
});

it('allows retrying the administrative queue after a network failure', async () => {
  vi.spyOn(verificationApi, 'list')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue([]);
  const user = userEvent.setup();
  render(<ReviewQueueView />);
  await user.click(
    await screen.findByRole('button', {
      name: 'No se pudo cargar la cola. Reintentar',
    }),
  );
  expect(
    await screen.findByText('No hay documentos pendientes.'),
  ).toBeInTheDocument();
});
