import { cleanup, screen, waitFor } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { radarIntegrationApi } from '../services/radar-integration.service';
import { SkillReviewPanel } from './skill-review-panel';

const { operationId, notFound } = vi.hoisted(() => ({
  operationId: '11111111-1111-4111-8111-111111111111',
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
  kind: 'skill' as const,
  targetId: 'skill-1',
  decision: 'approved' as const,
  changed: true,
  userId: 'user-1',
  completedAt: '2026-11-15T00:00:00.000Z',
};

const pendingSkill = {
  id: 'skill:skill-1',
  userId: 'user-1',
  userName: 'Ana',
  type: 'skill' as const,
  title: 'Desarrollo de software',
  status: 'pending',
  date: '2026-11-01',
  areaId: 'Desarrollo',
  evidenceRefs: ['certificado.pdf'],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('aprueba una habilidad usando el identificador de operación', async () => {
  vi.spyOn(radarIntegrationApi, 'reviews').mockResolvedValue([pendingSkill]);
  const status = vi
    .spyOn(radarIntegrationApi, 'operationStatus')
    .mockRejectedValue(notFound);
  const decision = vi
    .spyOn(radarIntegrationApi, 'decision')
    .mockResolvedValue(operationResult);

  const user = userEvent.setup();
  render(<SkillReviewPanel />);

  await screen.findAllByText('Desarrollo de software');
  expect(screen.getByText(/certificado\.pdf/)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Aprobar habilidad' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar' }));

  await waitFor(() => {
    expect(status).toHaveBeenCalledWith(operationId);
    expect(decision).toHaveBeenCalledWith(
      'skill',
      'skill-1',
      operationId,
      'approved',
    );
  });
});

it('recupera una aprobación guardada después de perder la respuesta', async () => {
  vi.spyOn(radarIntegrationApi, 'reviews').mockResolvedValue([pendingSkill]);

  vi.spyOn(radarIntegrationApi, 'operationStatus')
    .mockRejectedValueOnce(notFound)
    .mockResolvedValue(operationResult);

  const decision = vi
    .spyOn(radarIntegrationApi, 'decision')
    .mockRejectedValueOnce(new Error('Conexión interrumpida'));

  const user = userEvent.setup();
  render(<SkillReviewPanel />);

  await screen.findAllByText('Desarrollo de software');
  await user.click(screen.getByRole('button', { name: 'Aprobar habilidad' }));
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

  expect(decision).toHaveBeenCalledTimes(1);
  expect(radarIntegrationApi.operationStatus).toHaveBeenCalledTimes(2);
});
