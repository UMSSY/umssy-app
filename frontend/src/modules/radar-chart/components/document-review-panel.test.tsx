import { cleanup, screen, waitFor } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { radarIntegrationApi } from '../services/radar-integration.service';
import { verificationApi, type DocumentVerification } from '@/modules/cv';
import { DocumentReviewPanel } from './document-review-panel';

const { operationId, notFound, unavailable } = vi.hoisted(() => ({
  operationId: '22222222-2222-4222-8222-222222222222',
  notFound: Object.assign(new Error('Not found'), {
    isAxiosError: true,
    response: { status: 404 },
  }),
  unavailable: Object.assign(new Error('Conexión no disponible'), {
    isAxiosError: true,
    response: { status: 503 },
  }),
}));

vi.mock('../services/radar-review-idempotency', () => ({
  getRadarReviewOperationId: vi.fn().mockResolvedValue(operationId),
  clearRadarReviewOperationId: vi.fn().mockResolvedValue(undefined),
  listRadarReviewOperations: vi.fn().mockResolvedValue([]),
}));

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
  decidedAt: null,
  available: true,
  active: true,
  synced: false,
  noticeRead: false,
  publishedIds: [],
  radarVersion: null,
};

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DocumentReviewPanel: recuperación de decisiones', () => {
  it('devuelve el foco al cancelar la confirmación con Escape', async () => {
    vi.spyOn(verificationApi, 'list').mockResolvedValue([row]);
    const decide = vi.spyOn(radarIntegrationApi, 'documentDecision');
    const user = userEvent.setup();
    render(<DocumentReviewPanel />);

    const opener = await screen.findByRole('button', { name: 'Aprobar documento' });
    await user.click(opener);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
    });
    expect(decide).not.toHaveBeenCalled();
  });

  it('confirma normalmente una decisión', async () => {
    vi.spyOn(verificationApi, 'list').mockResolvedValue([row]);

    const status = vi
      .spyOn(radarIntegrationApi, 'documentOperationStatus')
      .mockRejectedValue(notFound);

    const decide = vi
      .spyOn(radarIntegrationApi, 'documentDecision')
      .mockResolvedValue(operationResult);

    const user = userEvent.setup();
    render(<DocumentReviewPanel />);

    await screen.findByText('Curso.pdf');
    await user.click(screen.getByRole('button', { name: 'Aprobar documento' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(status).toHaveBeenCalledWith(operationId);
      expect(decide).toHaveBeenCalledWith('v1', operationId, 'approved');
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Confirmar decisión' }),
      ).not.toBeInTheDocument();
    });
  });

  it('recupera una decisión guardada aunque se pierda la respuesta', async () => {
    vi.spyOn(verificationApi, 'list').mockResolvedValue([row]);

    const status = vi
      .spyOn(radarIntegrationApi, 'documentOperationStatus')
      .mockRejectedValueOnce(notFound)
      .mockResolvedValue(operationResult);

    const decide = vi
      .spyOn(radarIntegrationApi, 'documentDecision')
      .mockRejectedValueOnce(new Error('Conexión interrumpida'));

    const user = userEvent.setup();
    render(<DocumentReviewPanel />);

    await screen.findByText('Curso.pdf');
    await user.click(screen.getByRole('button', { name: 'Aprobar documento' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Confirmar decisión' }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Confirmar decisión' }),
      ).not.toBeInTheDocument();
    });

    expect(decide).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledTimes(2);
  });

  it('conserva la confirmación si no puede consultar el estado y permite reintentar', async () => {
    vi.spyOn(verificationApi, 'list').mockResolvedValue([row]);

    const status = vi
      .spyOn(radarIntegrationApi, 'documentOperationStatus')
      .mockRejectedValueOnce(unavailable)
      .mockRejectedValueOnce(notFound);

    const decide = vi
      .spyOn(radarIntegrationApi, 'documentDecision')
      .mockResolvedValue(operationResult);

    const user = userEvent.setup();
    render(<DocumentReviewPanel />);

    await screen.findByText('Curso.pdf');
    await user.click(screen.getByRole('button', { name: 'Aprobar documento' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(
      /No se pudo confirmar la decisi[oó]n/,
    );

    expect(
      screen.getByRole('heading', { name: 'Confirmar decisión' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(decide).toHaveBeenCalledWith('v1', operationId, 'approved');
    });

    expect(status).toHaveBeenCalledTimes(2);
  });
});
