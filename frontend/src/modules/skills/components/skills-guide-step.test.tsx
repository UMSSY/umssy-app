import { QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '@/shared/services/query-client';
import { MY_SKILLS_QUERY_KEY } from '../constants/skills.constants';
import { skillsService } from '../services/skills.service';
import type { SkillItem } from '../types/skill-item.types';
import { SkillsGuideStep } from './skills-guide-step';

vi.mock('../services/skills.service', () => ({
  skillsService: {
    getCatalog: vi.fn(),
    getMySkills: vi.fn(),
    getDetectedSkills: vi.fn(),
    analyzeSkills: vi.fn(),
    createCustomSkill: vi.fn(),
    saveMySkills: vi.fn(),
  },
}));

const SQL: SkillItem = { id: 'sql', name: 'SQL' };

function renderGuide() {
  const callbacks = {
    onSaved: vi.fn(),
    onDirtyChange: vi.fn(),
    onBusyChange: vi.fn(),
  };
  const client = createQueryClient();
  client.setQueryData(MY_SKILLS_QUERY_KEY, { catalog: [SQL], selected: [] });
  render(
    <QueryClientProvider client={client}>
      <SkillsGuideStep {...callbacks} />
    </QueryClientProvider>,
  );
  return { ...callbacks, user: userEvent.setup() };
}

beforeEach(() => {
  vi.mocked(skillsService.getCatalog).mockResolvedValue([SQL]);
  vi.mocked(skillsService.getMySkills).mockResolvedValue([]);
  vi.mocked(skillsService.getDetectedSkills).mockResolvedValue({
    status: 'ready',
    skills: [],
  });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('SkillsGuideStep', () => {
  it('keeps selection dirty through a failed request and signals success after the saved response', async () => {
    const callbacks = renderGuide();
    await callbacks.user.click(
      await screen.findByRole('button', { name: 'Añadir' }),
    );
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(true);
    vi.mocked(skillsService.saveMySkills).mockRejectedValueOnce(
      new Error('unavailable'),
    );
    await callbacks.user.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    );
    await screen.findByText(
      'No se pudieron guardar tus habilidades. Intenta de nuevo.',
    );
    expect(callbacks.onSaved).not.toHaveBeenCalled();
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(true);

    let resolveSave!: (items: SkillItem[]) => void;
    vi.mocked(skillsService.saveMySkills).mockImplementationOnce(
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
    await act(async () => {
      resolveSave([SQL]);
    });
    await waitFor(() => expect(callbacks.onSaved).toHaveBeenCalledOnce());
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(callbacks.onBusyChange).toHaveBeenLastCalledWith(false);
    expect(skillsService.saveMySkills).toHaveBeenLastCalledWith([SQL.id]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tracks unapplied custom input and does not silently save without it', async () => {
    const callbacks = renderGuide();
    const input = await screen.findByLabelText('¿No encuentras la habilidad?');
    await callbacks.user.type(input, 'Docker');
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(true);
    await callbacks.user.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    );
    expect(
      await screen.findByText(
        'Agrega la habilidad que escribiste o borra el texto antes de guardar.',
      ),
    ).toBeInTheDocument();
    expect(skillsService.saveMySkills).not.toHaveBeenCalled();
    expect(callbacks.onSaved).not.toHaveBeenCalled();
    await callbacks.user.clear(input);
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(false);

    await callbacks.user.click(screen.getByRole('button', { name: 'Añadir' }));
    const guide = screen.getByRole('region', {
      name: 'Habilidades en la guía',
    });
    await callbacks.user.click(
      within(guide).getByRole('button', { name: 'Quitar SQL' }),
    );
    expect(callbacks.onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});
