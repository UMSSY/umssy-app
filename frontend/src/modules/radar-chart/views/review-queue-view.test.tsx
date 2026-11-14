import { cleanup, screen, waitFor } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { verificationApi } from '@/modules/documents/services/document-verification.service';
import type { DocumentVerification } from '@/modules/documents/types/document-verification.types';
import { ReviewQueueView } from './review-queue-view';

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
  const decide = vi.spyOn(verificationApi, 'decide').mockResolvedValue();
  const user = userEvent.setup();
  render(<ReviewQueueView />);
  await screen.findByText(/Nombre distinto/);
  await user.click(screen.getByRole('button', { name: 'Aprobar documento' }));
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(decide).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Aprobar documento' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar' }));
  await waitFor(() => expect(decide).toHaveBeenCalledWith('v1', 'approved'));
});
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
