import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing/render-with-query';
import { certificationsService } from '../services/certifications.service';
import type { Certification } from '../types/certification.types';
import { CertificationGuideStep } from './certification-guide-step';

vi.mock('../services/certifications.service', () => ({
  certificationsService: {
    getCertifications: vi.fn(),
    updateCertification: vi.fn(),
    createWithDocument: vi.fn(),
    updateWithDocument: vi.fn(),
    deleteCertification: vi.fn(),
    getDocument: vi.fn(),
  },
}));

const CERTIFICATION: Certification = {
  id: 'certificate',
  name: 'CCNA',
  issuingOrganization: 'Cisco',
  issueDate: '2024-01-15',
  hasDocument: true,
  document: {
    fileName: 'ccna.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 256,
    uploadedAt: '2024-01-15',
  },
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
};

function renderGuide() {
  const callbacks = {
    onSaved: vi.fn(),
    onDirtyChange: vi.fn(),
    onBusyChange: vi.fn(),
  };
  renderWithQuery(<CertificationGuideStep {...callbacks} />);
  return { ...callbacks, user: userEvent.setup() };
}

beforeEach(() => {
  vi.mocked(certificationsService.getCertifications).mockResolvedValue([
    CERTIFICATION,
  ]);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('CertificationGuideStep', () => {
  it('requires the existing delete dialog confirmation before removing a certification', async () => {
    vi.mocked(certificationsService.deleteCertification).mockResolvedValue();
    const { user } = renderGuide();
    await user.click(await screen.findByRole('button', { name: 'Eliminar CCNA' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Eliminar certificación' });
    expect(certificationsService.deleteCertification).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(certificationsService.deleteCertification).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Eliminar CCNA' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(certificationsService.deleteCertification).toHaveBeenCalledExactlyOnceWith(CERTIFICATION.id));
  });

  it('keeps the inline draft after a failed save and reports success only after persistence', async () => {
    vi.mocked(certificationsService.updateCertification).mockRejectedValueOnce(
      new Error('unavailable'),
    );
    const callbacks = renderGuide();
    await callbacks.user.click(
      await screen.findByRole('button', { name: 'Editar CCNA' }),
    );
    const input = screen.getByLabelText(/Nombre de la certificación/);
    await callbacks.user.clear(input);
    await callbacks.user.type(input, 'CCNP');
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await callbacks.user.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    );
    expect(
      await screen.findByText(
        'No se pudo actualizar la certificación. Inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
    expect(input).toHaveValue('CCNP');
    expect(callbacks.onSaved).not.toHaveBeenCalled();

    let resolveSave!: (certification: Certification) => void;
    vi.mocked(certificationsService.updateCertification).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    await callbacks.user.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    );
    await waitFor(() =>
      expect(callbacks.onBusyChange).toHaveBeenLastCalledWith(true),
    );
    expect(callbacks.onSaved).not.toHaveBeenCalled();
    await act(async () => {
      resolveSave({ ...CERTIFICATION, name: 'CCNP' });
    });
    await waitFor(() => expect(callbacks.onSaved).toHaveBeenCalledOnce());
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(callbacks.onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it('restores clean state when changes are reverted or cancelled', async () => {
    const { user, onDirtyChange, onSaved } = renderGuide();
    await user.click(
      await screen.findByRole('button', { name: 'Editar CCNA' }),
    );
    const input = screen.getByLabelText(/Nombre de la certificación/);
    await user.type(input, ' extra');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await user.clear(input);
    await user.type(input, 'CCNA');
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    await user.type(input, ' extra');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
