import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { DocumentsCvView } from '@/modules/documents/views/documents-cv-view';
import type { SavedCv } from '@/modules/documents/types/saved-cv.types';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import { createProfileCompleteness } from './profile-completeness.fixture';

const api = vi.hoisted(() => ({
  completeness: vi.fn(),
  list: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/shared/contexts/auth-context', () => ({
  useAuth: () => ({ currentUserId: 'owner', isLoading: false }),
}));
vi.mock('../services/profile-completeness.service', () => ({
  profileCompletenessService: { getCompleteness: api.completeness },
}));
vi.mock('../services/profile.service', () => ({
  profileService: { getProfile: vi.fn().mockResolvedValue(null) },
}));
vi.mock('@/modules/documents/services/documents.service', () => ({
  documentsService: {
    getCvs: api.list,
    uploadCv: api.upload,
    deleteCv: api.remove,
  },
}));

const withoutCv = PROFILE_COMPLETENESS_SECTION_IDS.filter((id) => id !== 'cv');
let savedCvs: SavedCv[];

function savedCv(id: string): SavedCv {
  return {
    id,
    fileName: `${id}.pdf`,
    fileType: 'PDF',
    sizeInBytes: 32,
    updatedAt: new Date('2026-11-11'),
    isCurrent: true,
  };
}

beforeEach(() => {
  savedCvs = [];
  window.history.replaceState(null, '', '/profile/documents');
  api.completeness.mockImplementation(async () =>
    createProfileCompleteness(
      savedCvs.length ? PROFILE_COMPLETENESS_SECTION_IDS : withoutCv,
    ),
  );
  api.list.mockImplementation(async () => ({
    items: savedCvs,
    totalItems: savedCvs.length,
    totalPages: savedCvs.length ? 1 : 0,
    page: 1,
  }));
  api.upload.mockImplementation(async () => {
    const cv = savedCv('new');
    savedCvs = [cv, ...savedCvs];
    return cv;
  });
  api.remove.mockImplementation(async (id: string) => {
    savedCvs = savedCvs.filter((cv) => cv.id !== id);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('CV profile completeness', () => {
  it('shows the bar above the upload form and updates to 100 only after saving the PDF', async () => {
    const user = userEvent.setup();
    render(<DocumentsCvView />);
    const bar = await screen.findByRole('progressbar', {
      name: 'Completitud del perfil',
    });
    expect(bar).toHaveAttribute('aria-valuenow', '85');
    const select = await screen.findByRole('button', {
      name: 'Seleccionar PDF',
    });
    expect(
      bar.compareDocumentPosition(select) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await user.upload(
      screen.getByLabelText('Archivo PDF del CV'),
      new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }),
    );
    expect(bar).toHaveAttribute('aria-valuenow', '85');
    expect(
      screen.getByRole('listitem', { name: 'Documentos y CV: Pendiente' }),
    ).toBeVisible();
    expect(api.upload).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirmar carga' }));
    await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '100'));
    expect(
      screen.queryByRole('region', { name: 'Secciones del perfil' }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Ver secciones del perfil' }),
    );
    expect(screen.getByText('7 de 7 secciones completadas')).toBeVisible();
    expect(
      screen.getByRole('listitem', { name: 'Documentos y CV: Completada' }),
    ).toBeVisible();
  });

  it('preserves the saved percentage after a failed upload and allows retrying', async () => {
    const user = userEvent.setup();
    api.upload.mockRejectedValueOnce(new Error('Upload failed'));
    render(<DocumentsCvView />);
    const bar = await screen.findByRole('progressbar', {
      name: 'Completitud del perfil',
    });
    await user.upload(
      screen.getByLabelText('Archivo PDF del CV'),
      new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: 'Confirmar carga' }));
    await screen.findByRole('alert');
    expect(bar).toHaveAttribute('aria-valuenow', '85');
    expect(api.completeness).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Confirmar carga' }));
    await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '100'));
  });

  it.each([false, true])(
    'recomputes after deleting a CV, keeping credit if another remains: %s',
    async (hasOlderCv) => {
      const user = userEvent.setup();
      savedCvs = [
        savedCv('current'),
        ...(hasOlderCv ? [savedCv('older')] : []),
      ];
      render(<DocumentsCvView />);
      const bar = await screen.findByRole('progressbar', {
        name: 'Completitud del perfil',
      });
      expect(bar).toHaveAttribute('aria-valuenow', '100');
      await user.click(
        await screen.findByRole('button', { name: 'Eliminar current.pdf' }),
      );
      const dialog = screen.getByRole('alertdialog');
      await user.click(
        within(dialog).getByRole('button', { name: 'Eliminar' }),
      );
      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(bar).toHaveAttribute('aria-valuenow', hasOlderCv ? '100' : '85'),
      );
      expect(api.completeness).toHaveBeenCalledTimes(2);
      if (!hasOlderCv)
        expect(
          screen.getByRole('listitem', { name: 'Documentos y CV: Pendiente' }),
        ).toBeVisible();
    },
  );

  it('focuses the upload control when arriving from the CV checklist link', async () => {
    window.history.replaceState(null, '', '/profile/documents#complete-cv');
    const scroll = vi.fn();
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView',
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scroll,
    });
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    try {
      render(<DocumentsCvView />);
      const select = await screen.findByRole('button', {
        name: 'Seleccionar PDF',
      });
      await waitFor(() => expect(select).toHaveFocus());
      expect(scroll).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
      expect(window.location.hash).toBe('');
      expect(api.upload).not.toHaveBeenCalled();
    } finally {
      if (original)
        Object.defineProperty(
          HTMLElement.prototype,
          'scrollIntoView',
          original,
        );
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
  });

  it('keeps the completed percentage when deleting a CV fails', async () => {
    const user = userEvent.setup();
    savedCvs = [savedCv('current')];
    api.remove.mockRejectedValueOnce(new Error('Delete failed'));
    render(<DocumentsCvView />);
    const bar = await screen.findByRole('progressbar', {
      name: 'Completitud del perfil',
    });
    await user.click(
      await screen.findByRole('button', { name: 'Eliminar current.pdf' }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Eliminar',
      }),
    );
    await screen.findByRole('alert');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(api.completeness).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('button', { name: 'Eliminar current.pdf' }),
    ).toBeEnabled();
  });

  it('shows the same percentage in the replacement and CV generation dialogs', async () => {
    const user = userEvent.setup();
    savedCvs = [savedCv('current')];
    render(<DocumentsCvView />);
    await screen.findByRole('progressbar', { name: 'Completitud del perfil' });
    await user.upload(
      screen.getByLabelText('Archivo PDF del CV'),
      new File(['%PDF'], 'new.pdf', { type: 'application/pdf' }),
    );
    const replacement = await screen.findByRole('alertdialog');
    expect(
      within(replacement).getByRole('progressbar', {
        name: 'Completitud del perfil',
      }),
    ).toHaveAttribute('aria-valuenow', '100');
    await user.click(
      within(replacement).getByRole('button', { name: 'Cancelar' }),
    );
    await user.click(screen.getByRole('button', { name: 'Generar CV' }));
    const generation = await screen.findByRole('dialog', {
      name: 'Generar CV profesional',
    });
    expect(
      within(generation).getByRole('progressbar', {
        name: 'Completitud del perfil',
      }),
    ).toHaveAttribute('aria-valuenow', '100');
    expect(api.completeness).toHaveBeenCalledOnce();
  });
});
