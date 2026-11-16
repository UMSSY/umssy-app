import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { DEGREE_CATALOG_FIXTURE } from '../testing/degree-catalog.fixture';
import { educationsService } from '../services/educations.service';
import type { EducationItem } from '../types/education-item.types';
import { EducationGuideStep } from './education-guide-step';

vi.mock('../services/educations.service', () => ({
  educationsService: {
    getInstitutions: vi.fn(),
    getDegrees: vi.fn(),
    getEducations: vi.fn(),
    createEducation: vi.fn(),
    updateEducation: vi.fn(),
    deleteEducation: vi.fn(),
  },
}));

const EDUCATION: EducationItem = {
  id: 'education-1',
  institution: 'Universidad Mayor de San Simón (UMSS)',
  degree: 'Ingeniería Informática',
  startDate: '2020-02-01',
  endDate: null,
  description: 'Formación profesional',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

function setupStep() {
  const callbacks = {
    onSaved: vi.fn(),
    onDirtyChange: vi.fn(),
    onBusyChange: vi.fn(),
  };
  render(<EducationGuideStep {...callbacks} />);
  return { user: userEvent.setup(), ...callbacks };
}

describe('EducationGuideStep', () => {
  beforeEach(() => {
    vi.mocked(educationsService.getInstitutions).mockResolvedValue([
      { name: EDUCATION.institution, aliases: ['UMSS'] },
    ]);
    vi.mocked(educationsService.getDegrees).mockResolvedValue(
      DEGREE_CATALOG_FIXTURE,
    );
    vi.mocked(educationsService.getEducations).mockResolvedValue([EDUCATION]);
  });
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('edits a legacy record inline and signals completion only after a successful save', async () => {
    let resolveSave!: (item: EducationItem) => void;
    vi.mocked(educationsService.updateEducation).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const { user, onSaved, onDirtyChange, onBusyChange } = setupStep();
    await screen.findByRole('form', { name: 'Agregar formación' });
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(
      screen.getByRole('button', { name: 'Editar Ingeniería Informática' }),
    );
    fireEvent.change(screen.getByLabelText(/Descripción/), {
      target: { value: 'Formación actualizada' },
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(true));
    expect(onSaved).not.toHaveBeenCalled();
    expect(educationsService.updateEducation).toHaveBeenCalledWith(
      EDUCATION.id,
      expect.objectContaining({ description: 'Formación actualizada' }),
    );
    await act(async () =>
      resolveSave({ ...EDUCATION, description: 'Formación actualizada' }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    await user.click(screen.getByRole('button', { name: 'Añadir formación' }));
    expect(
      screen.getByRole('form', { name: 'Agregar formación' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Institución/)).toHaveValue('');
  });

  it('retains dirty edits when saving fails and deletes only a confirmed record', async () => {
    vi.mocked(educationsService.updateEducation).mockRejectedValue(
      new Error('No disponible'),
    );
    vi.mocked(educationsService.deleteEducation).mockResolvedValue();
    const { user, onSaved, onDirtyChange } = setupStep();
    await screen.findByRole('form', { name: 'Agregar formación' });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(
      screen.getByRole('button', { name: 'Editar Ingeniería Informática' }),
    );
    fireEvent.change(screen.getByLabelText(/Descripción/), {
      target: { value: 'Cambios pendientes' },
    });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onSaved).not.toHaveBeenCalled();
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByLabelText(/Descripción/)).toHaveValue(
      'Cambios pendientes',
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(
      screen.getByRole('button', { name: 'Eliminar Ingeniería Informática' }),
    );
    expect(educationsService.deleteEducation).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('alertdialog');
    expect(confirmation).toHaveAccessibleName('¿Eliminar esta formación?');
    await user.click(within(confirmation).getByRole('button', { name: 'Cancelar' }));
    expect(educationsService.deleteEducation).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Eliminar Ingeniería Informática' }),
    );
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() =>
      expect(educationsService.deleteEducation).toHaveBeenCalledExactlyOnceWith(
        EDUCATION.id,
      ),
    );
  });

  it('adds a second degree without replacing the first record', async () => {
    let records = [EDUCATION];
    vi.mocked(educationsService.getEducations).mockImplementation(() =>
      Promise.resolve([...records]),
    );
    vi.mocked(educationsService.createEducation).mockImplementation(
      (payload) => {
        const created = { ...EDUCATION, ...payload, id: 'education-2' };
        records = [...records, created];
        return Promise.resolve(created);
      },
    );
    const { user, onSaved } = setupStep();
    await screen.findByRole('form', { name: 'Agregar formación' });
    await waitFor(() =>
      expect(screen.getByLabelText(/Institución/)).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText(/Institución/), {
      target: { value: EDUCATION.institution },
    });
    fireEvent.change(screen.getByLabelText(/Título o carrera/), {
      target: { value: 'Ingeniería de Sistemas' },
    });
    fireEvent.change(screen.getByLabelText(/Desde/), {
      target: { value: '2020-02-01' },
    });
    fireEvent.change(screen.getByLabelText(/Hasta/), {
      target: { value: '2025-11-30' },
    });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(
      await screen.findByRole('button', {
        name: 'Editar Ingeniería de Sistemas',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar Ingeniería Informática' }),
    ).toBeInTheDocument();
    expect(educationsService.updateEducation).not.toHaveBeenCalled();
  });
});
