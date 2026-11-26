import { cleanup, screen, within } from '@testing-library/react';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { VerificationFlow, VerificationResult } from './verification-result';
import { verificationLabels } from '../constants/verification-labels.constants';
import { VerificationDashboard } from './verification-dashboard';
import { verificationApi } from '../services/document-verification.service';
import { documentsService } from '../services/documents.service';
import type { DocumentVerification } from '../types/document-verification.types';
const row: DocumentVerification = {
  id: 'v1',
  noticeRead: true,
  sourceId: 'cv1',
  sourceType: 'cv',
  filename: 'Perfil.pdf',
  mime: 'application/pdf',
  sizeBytes: 100,
  createdAt: '2026-11-11T13:00:00Z',
  decidedAt: '2026-11-11T13:01:00Z',
  synced: true,
  active: true,
  available: true,
  reason: 'Lectura correcta',
  skills: [{ id: 'docker', name: 'Docker', areaId: 'cloud-devops' }],
  status: 'approved',
  confidence: 0.96,
  radarVersion: 2,
  publishedIds: ['docker'],
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('abre el detalle, el área, la vista previa de esa versión y su cierre', async () => {
  vi.spyOn(verificationApi, 'file').mockResolvedValue(
    new Blob(['pdf'], { type: 'application/pdf' }),
  );
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:demo');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  render(<VerificationDashboard rows={[row]} refresh={vi.fn()} />);
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Ver detalle del análisis' }),
  );
  const modal = within(screen.getByRole('dialog'));
  expect(modal.getByText('Docker')).toBeInTheDocument();
  expect(modal.getByText(/Cloud\/DevOps/)).toBeInTheDocument();
  expect(modal.getByText('Aprobado')).toBeInTheDocument();
  await user.click(modal.getByRole('button', { name: 'Ver documento' }));
  expect(verificationApi.file).toHaveBeenCalledWith('v1');
  await screen.findByTitle('Vista previa de Perfil.pdf');
  await user.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('la papelera permite cancelar y confirmar la eliminación del documento correcto', async () => {
  const remove = vi.spyOn(documentsService, 'deleteCv').mockResolvedValue();
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(<VerificationDashboard rows={[row]} refresh={refresh} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Eliminar Perfil.pdf' }));
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Eliminar Perfil.pdf' }));
  await user.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Eliminar',
    }),
  );
  expect(remove).toHaveBeenCalledWith('cv1');
});
it('limita el resumen a 20 y abre las cien habilidades desde el historial', async () => {
  const skills = Array.from({ length: 100 }, (_, i) => ({
    id: String(i),
    name: 'Habilidad ' + (i + 1),
    areaId: 'desarrollo',
  }));
  render(
    <VerificationDashboard
      rows={[{ ...row, skills, status: 'manual_approved', noticeRead: false }]}
      refresh={vi.fn()}
    />,
  );
  expect(screen.getByText(/Habilidad 20…/)).toBeInTheDocument();
  expect(screen.queryByText(/Habilidad 21/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Entendido' })).toBeNull();
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Ver historial de verificaciones' }),
  );
  const history = within(
    screen.getByRole('dialog', { name: 'Historial de verificaciones' }),
  );
  await user.click(history.getByRole('button', { name: /Perfil.pdf/ }));
  expect(
    within(screen.getByRole('dialog')).getByText('Habilidad 100'),
  ).toBeInTheDocument();
});
it('al eliminar el último archivo conserva su resultado solo en el historial', async () => {
  const user = userEvent.setup();
  const props = { refresh: vi.fn() };
  const { rerender } = render(
    <VerificationDashboard rows={[row]} {...props} />,
  );
  expect(
    screen.getByRole('button', { name: 'Ver detalle del análisis' }),
  ).toBeEnabled();
  const removed = {
    ...row,
    active: false,
    available: false,
    status: 'manual_rejected' as const,
    noticeRead: false,
  };
  rerender(<VerificationDashboard rows={[removed]} {...props} />);
  expect(screen.getByText('Sin medición')).toBeInTheDocument();
  expect(screen.queryByText('Rechazado por administración')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Entendido' })).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Ver detalle del análisis' }),
  ).toBeNull();
  await user.click(
    screen.getByRole('button', { name: 'Ver historial de verificaciones' }),
  );
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: /Perfil.pdf/,
    }),
  );
  expect(
    within(screen.getByRole('dialog')).getByText(
      'Rechazado por administración',
    ),
  ).toBeInTheDocument();
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }),
  );
  expect(screen.getByText('Sin medición')).toBeInTheDocument();
  expect(screen.queryByText('Rechazado por administración')).toBeNull();
});

it('muestra el rechazo del archivo activo en su resultado sin el aviso superior', () => {
  render(
    <VerificationDashboard
      rows={[{ ...row, status: 'manual_rejected', noticeRead: false }]}
      refresh={vi.fn()}
    />,
  );
  expect(
    screen.getAllByText('Rechazado por administración').length,
  ).toBeGreaterThan(0);
  expect(screen.queryByText('Analizado automáticamente')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Entendido' })).toBeNull();
});

it.each([
  'manual_approved',
  'manual_rejected',
  'review',
  'low_confidence',
] as const)('uses the actual %s decision in the file list', (status) => {
  render(
    <VerificationDashboard rows={[{ ...row, status }]} refresh={vi.fn()} />,
  );
  const files = screen.getAllByRole('list')[0];
  expect(within(files).queryByText('Analizado automáticamente')).toBeNull();
  expect(
    within(files).getByText(verificationLabels[status]),
  ).toBeInTheDocument();
});
it.each(['manual_rejected', 'review', 'low_confidence'] as const)(
  'does not mark validation or publication complete for %s',
  (status) => {
    render(<VerificationFlow doc={{ ...row, status }} />);
    const steps = screen.getAllByRole('listitem');
    expect(within(steps[2]).queryByText('completado')).toBeNull();
    expect(within(steps[3]).queryByText('completado')).toBeNull();
    expect(
      within(steps[2]).getByText(verificationLabels[status]),
    ).toBeInTheDocument();
  },
);
it('only marks publication complete after approval is synchronized with a radar version', () => {
  const { rerender } = render(
    <VerificationFlow
      doc={{ ...row, status: 'manual_approved', synced: false }}
    />,
  );
  expect(
    within(screen.getAllByRole('listitem')[3]).queryByText('completado'),
  ).toBeNull();
  rerender(<VerificationFlow doc={{ ...row, status: 'manual_approved' }} />);
  expect(
    within(screen.getAllByRole('listitem')[3]).getByText('completado'),
  ).toBeInTheDocument();
});
it('distinguishes a real OCR zero from missing measurement', () => {
  render(
    <VerificationResult doc={{ ...row, confidence: 0 }} details={vi.fn()} />,
  );
  expect(screen.getByText(/^0\s*%$/)).toBeInTheDocument();
  expect(screen.queryByText('Sin medición')).toBeNull();
});
