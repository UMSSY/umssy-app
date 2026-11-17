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
import { MY_SKILLS_QUERY_KEY } from '@/modules/skills';
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { workExperienceService } from '../services/work-experience.service';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import { WorkExperienceGuideStep } from './work-experience-guide-step';

vi.mock('../services/work-experience.service', () => ({
  workExperienceService: {
    getWorkExperiences: vi.fn(),
    createWorkExperience: vi.fn(),
    updateWorkExperience: vi.fn(),
    deleteWorkExperience: vi.fn(),
  },
}));
vi.mock('@/modules/matching/services/skills-analysis.service', () => ({
  skillsAnalysisService: {
    previewExperience: vi.fn().mockResolvedValue({ skills: [] }),
  },
}));
vi.mock('@/modules/profile/services/profile-skills-radar.service', () => ({
  profileSkillsRadarService: {
    analyzeSkills: vi.fn().mockResolvedValue({ skills: [] }),
  },
}));

const EXPERIENCE: WorkExperienceItem = {
  id: 'experience-1',
  companyName: 'Tecnored',
  position: 'Desarrollador',
  startDate: '2024-01-01',
  endDate: null,
  isCurrent: true,
  description: 'Aplicaciones profesionales',
};

function setupStep() {
  const callbacks = {
    onSaved: vi.fn(),
    onDirtyChange: vi.fn(),
    onBusyChange: vi.fn(),
  };
  const { client } = render(<WorkExperienceGuideStep {...callbacks} />);
  return { user: userEvent.setup(), client, ...callbacks };
}

describe('WorkExperienceGuideStep', () => {
  beforeEach(() => {
    vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValue([
      EXPERIENCE,
    ]);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lets the guide continue after a saved write while the skills refresh is still pending', async () => {
    let finishRefresh!: () => void;
    const refreshing = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    vi.mocked(workExperienceService.updateWorkExperience).mockResolvedValueOnce(
      EXPERIENCE,
    );
    const { user, client, onSaved, onBusyChange } = setupStep();
    const invalidate = client.invalidateQueries.bind(client);
    vi.spyOn(client, 'invalidateQueries').mockImplementation((filters) =>
      filters?.queryKey === MY_SKILLS_QUERY_KEY
        ? refreshing
        : invalidate(filters),
    );
    await screen.findByRole('form', { name: 'Agregar experiencia' });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(
      screen.getByRole('button', { name: 'Editar Desarrollador' }),
    );
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(
      await screen.findByText(
        /Analizando las habilidades de tu experiencia en segundo plano/,
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    expect(
      screen.getByRole('button', { name: 'Añadir experiencia' }),
    ).toBeEnabled();
    await act(async () => {
      finishRefresh();
    });
    await waitFor(() =>
      expect(
        screen.queryByText(
          /Analizando las habilidades de tu experiencia en segundo plano/,
        ),
      ).not.toBeInTheDocument(),
    );
  });

  it('saves an existing job inline before notifying the guide and keeps adding records available', async () => {
    let resolveSave!: (item: WorkExperienceItem) => void;
    vi.mocked(workExperienceService.updateWorkExperience).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    const { user, onSaved, onDirtyChange, onBusyChange } = setupStep();
    await screen.findByRole('form', { name: 'Agregar experiencia' });
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(
      screen.getByRole('button', { name: 'Editar Desarrollador' }),
    );
    fireEvent.change(screen.getByLabelText(/Descripción de funciones/), {
      target: { value: 'Aplicaciones con React' },
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(true));
    expect(onSaved).not.toHaveBeenCalled();
    expect(workExperienceService.updateWorkExperience).toHaveBeenCalledWith(
      EXPERIENCE.id,
      expect.objectContaining({
        description: 'Aplicaciones con React',
        isCurrent: true,
        endDate: null,
      }),
    );
    await act(async () =>
      resolveSave({ ...EXPERIENCE, description: 'Aplicaciones con React' }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    await user.click(
      screen.getByRole('button', { name: 'Añadir experiencia' }),
    );
    expect(
      screen.getByRole('form', { name: 'Agregar experiencia' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Empresa/)).toHaveValue('');
  });

  it('keeps failed edits and reuses the accessible delete confirmation', async () => {
    vi.mocked(workExperienceService.updateWorkExperience).mockRejectedValue(
      new Error('No disponible'),
    );
    vi.mocked(workExperienceService.deleteWorkExperience).mockResolvedValue();
    const { user, onSaved, onDirtyChange } = setupStep();
    await screen.findByRole('form', { name: 'Agregar experiencia' });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(
      screen.getByRole('button', { name: 'Editar Desarrollador' }),
    );
    fireEvent.change(screen.getByLabelText(/Cargo/), {
      target: { value: 'Ingeniero' },
    });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onSaved).not.toHaveBeenCalled();
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByLabelText(/Cargo/)).toHaveValue('Ingeniero');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(
      screen.getByRole('button', { name: 'Eliminar Desarrollador' }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Eliminar experiencia');
    expect(workExperienceService.deleteWorkExperience).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));
    expect(workExperienceService.deleteWorkExperience).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Eliminar Desarrollador' }),
    );
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() =>
      expect(
        workExperienceService.deleteWorkExperience,
      ).toHaveBeenCalledExactlyOnceWith(EXPERIENCE.id),
    );
  });

  it('adds a second job without replacing the first record', async () => {
    let records = [EXPERIENCE];
    vi.mocked(workExperienceService.getWorkExperiences).mockImplementation(() =>
      Promise.resolve([...records]),
    );
    vi.mocked(workExperienceService.createWorkExperience).mockImplementation(
      (payload) => {
        const created = { ...payload, id: 'experience-2' };
        records = [...records, created];
        return Promise.resolve(created);
      },
    );
    const { user, onSaved } = setupStep();
    await screen.findByRole('form', { name: 'Agregar experiencia' });
    fireEvent.change(screen.getByLabelText(/Empresa/), {
      target: { value: 'UMSS' },
    });
    fireEvent.change(screen.getByLabelText(/Cargo/), {
      target: { value: 'Auxiliar de laboratorio' },
    });
    fireEvent.change(screen.getByLabelText(/Desde/), {
      target: { value: '2020-02-01' },
    });
    fireEvent.change(screen.getByLabelText('Hasta'), {
      target: { value: '2021-11-30' },
    });
    fireEvent.change(screen.getByLabelText(/Descripción de funciones/), {
      target: { value: 'Apoyo en programación' },
    });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(
      await screen.findByRole('button', {
        name: 'Editar Auxiliar de laboratorio',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar Desarrollador' }),
    ).toBeInTheDocument();
    expect(workExperienceService.updateWorkExperience).not.toHaveBeenCalled();
  });
});
