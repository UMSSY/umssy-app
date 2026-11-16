import { renderHookWithQuery as renderHook } from '@/shared/testing/render-hook-with-query';
import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { skillsService } from '../services/skills.service';
import { useSkills } from './use-skills';
import { createQueryWrapper } from '@/shared/testing/create-query-wrapper';
import { MY_SKILLS_QUERY_KEY } from '../constants/skills.constants';

vi.mock('../services/skills.service', () => ({
  skillsService: {
    getCatalog: vi.fn(),
    getMySkills: vi.fn(),
    createCustomSkill: vi.fn(),
    saveMySkills: vi.fn(),
  },
}));

const PYTHON = { id: '33333333-3333-4333-8333-333333333333', name: 'Python' };
const SQL = { id: '44444444-4444-4444-8444-444444444444', name: 'SQL' };
const DOCKER = { id: '55555555-5555-4555-8555-555555555555', name: 'Docker' };

async function renderLoadedHook() {
  const hook = renderHook(() => useSkills());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe('useSkills', () => {
  beforeEach(() => {
    vi.mocked(skillsService.getCatalog).mockResolvedValue([PYTHON, SQL]);
    vi.mocked(skillsService.getMySkills).mockResolvedValue([PYTHON]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('reuses guide suggestions and keeps the selected skills visible during a refresh', async () => {
    const { wrapper, client } = createQueryWrapper();
    const first = renderHook(() => useSkills({ forGuide: true }), { wrapper });
    await waitFor(() =>
      expect(first.result.current.selectedSkills).toEqual([PYTHON]),
    );
    first.unmount();
    const second = renderHook(() => useSkills({ forGuide: true }), { wrapper });
    expect(second.result.current.isLoading).toBe(false);
    expect(skillsService.getCatalog).toHaveBeenCalledOnce();
    expect(skillsService.getMySkills).toHaveBeenCalledOnce();
    let finish!: (items: (typeof PYTHON)[]) => void;
    vi.mocked(skillsService.getMySkills).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    let refreshed!: Promise<void>;
    act(() => {
      refreshed = client.invalidateQueries({ queryKey: MY_SKILLS_QUERY_KEY });
    });
    await waitFor(() =>
      expect(skillsService.getMySkills).toHaveBeenCalledTimes(2),
    );
    expect(second.result.current.isLoading).toBe(false);
    expect(second.result.current.selectedSkills).toEqual([PYTHON]);
    await act(async () => {
      finish([SQL]);
      await refreshed;
    });
    await waitFor(() =>
      expect(second.result.current.selectedSkills).toEqual([SQL]),
    );
  });

  it('loads the catalog and the saved skills of the user', async () => {
    const { result } = await renderLoadedHook();

    expect(result.current.catalogSkills).toEqual([PYTHON, SQL]);
    expect(result.current.selectedSkills).toEqual([PYTHON]);
    expect(result.current.feedback).toBeNull();
  });

  it('shows an error message when the skills cannot be loaded', async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = await renderLoadedHook();

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.feedback).toEqual({
      type: 'error',
      message: 'Tu sesión no es válida. Inicia sesión nuevamente.',
    });
  });

  it('blocks saving and mutations when initial load fails', async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValue(
      new Error('Network Error'),
    );

    const { result } = await renderLoadedHook();

    expect(result.current.hasLoadError).toBe(true);
    expect(result.current.selectedSkills).toEqual([]);

    act(() => result.current.addSkill(SQL));
    expect(result.current.selectedSkills).toEqual([]);

    act(() => result.current.createCustomSkill('Docker'));
    expect(result.current.selectedSkills).toEqual([]);

    await act(() => result.current.saveSkills());
    expect(skillsService.saveMySkills).not.toHaveBeenCalled();
  });

  it('reloads the catalog and user skills when reload is called', async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValueOnce(
      new Error('Network Error'),
    );

    const { result } = await renderLoadedHook();
    expect(result.current.hasLoadError).toBe(true);

    vi.mocked(skillsService.getMySkills).mockResolvedValue([PYTHON]);
    await act(() => result.current.reload());

    expect(result.current.hasLoadError).toBe(false);
    expect(result.current.selectedSkills).toEqual([PYTHON]);
  });

  it('does not update the state after unmounting', async () => {
    const { unmount } = renderHook(() => useSkills());
    unmount();

    await waitFor(() => expect(skillsService.getMySkills).toHaveBeenCalled());
  });

  it('does not update the state when loading fails after unmounting', async () => {
    vi.mocked(skillsService.getMySkills).mockRejectedValue(
      new Error('Network Error'),
    );
    const { unmount } = renderHook(() => useSkills());
    unmount();

    await waitFor(() => expect(skillsService.getMySkills).toHaveBeenCalled());
  });

  it('adds a skill only once and removes it without affecting the others', async () => {
    const { result } = await renderLoadedHook();

    act(() => result.current.addSkill(SQL));
    act(() => result.current.addSkill(SQL));
    expect(result.current.selectedSkills).toEqual([PYTHON, SQL]);

    act(() => result.current.removeSkill(PYTHON.id));
    expect(result.current.selectedSkills).toEqual([SQL]);
  });

  it('registers the pending custom skills before saving the whole list', async () => {
    vi.mocked(skillsService.createCustomSkill).mockResolvedValue(DOCKER);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([DOCKER, PYTHON]);
    const { result } = await renderLoadedHook();

    act(() => result.current.createCustomSkill('Docker'));
    expect(result.current.selectedSkills).toEqual([
      PYTHON,
      { id: 'pending-docker', name: 'Docker' },
    ]);

    await act(() => result.current.saveSkills());

    expect(skillsService.createCustomSkill).toHaveBeenCalledWith('Docker');
    expect(skillsService.saveMySkills).toHaveBeenCalledWith([
      PYTHON.id,
      DOCKER.id,
    ]);
    expect(result.current.selectedSkills).toEqual([DOCKER, PYTHON]);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.feedback).toEqual({
      type: 'success',
      message: 'Tus habilidades se guardaron correctamente.',
    });
  });

  it('does not send the same id twice when a custom skill reuses a selected one', async () => {
    vi.mocked(skillsService.createCustomSkill).mockResolvedValue(PYTHON);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([PYTHON]);
    const { result } = await renderLoadedHook();

    act(() => result.current.createCustomSkill('Python'));
    await act(() => result.current.saveSkills());

    expect(skillsService.saveMySkills).toHaveBeenCalledWith([PYTHON.id]);
  });

  it('keeps the skills backed by an experience or the CV out of the manual selection when saving', async () => {
    const manual = { ...PYTHON, origins: ['manual' as const] };
    const fromExperience = { ...SQL, origins: ['experience' as const] };
    const fromCv = { ...DOCKER, origins: ['cv' as const] };
    const manualWithExperience = {
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Java',
      origins: ['manual' as const, 'experience' as const],
    };
    vi.mocked(skillsService.getMySkills).mockResolvedValue([
      manual,
      fromExperience,
      fromCv,
      manualWithExperience,
    ]);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([
      manual,
      fromExperience,
      fromCv,
      manualWithExperience,
    ]);
    const { result } = await renderLoadedHook();

    await act(() => result.current.saveSkills());

    expect(skillsService.saveMySkills).toHaveBeenCalledWith([
      manual.id,
      manualWithExperience.id,
    ]);
  });

  it('sends a new skill picked from the catalog together with the manual ones', async () => {
    const manual = { ...PYTHON, origins: ['manual' as const] };
    const fromCv = { ...DOCKER, origins: ['cv' as const] };
    vi.mocked(skillsService.getMySkills).mockResolvedValue([manual, fromCv]);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([
      manual,
      SQL,
      fromCv,
    ]);
    const { result } = await renderLoadedHook();

    act(() => result.current.addSkill(SQL));
    await act(() => result.current.saveSkills());

    expect(skillsService.saveMySkills).toHaveBeenCalledWith([
      manual.id,
      SQL.id,
    ]);
  });

  it('removes a manual skill from the saved list (AC-10.3)', async () => {
    const manual = { ...PYTHON, origins: ['manual' as const] };
    const fromExperience = { ...SQL, origins: ['experience' as const] };
    vi.mocked(skillsService.getMySkills).mockResolvedValue([
      manual,
      fromExperience,
    ]);
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([fromExperience]);
    const { result } = await renderLoadedHook();

    act(() => result.current.removeSkill(manual.id));
    await act(() => result.current.saveSkills());

    expect(skillsService.saveMySkills).toHaveBeenCalledWith([]);
    expect(result.current.selectedSkills).toEqual([fromExperience]);
  });

  it('shows an error message when saving fails', async () => {
    vi.mocked(skillsService.saveMySkills).mockRejectedValue({
      response: { status: 409 },
    });
    const { result } = await renderLoadedHook();

    await act(() => result.current.saveSkills());

    expect(result.current.feedback).toEqual({
      type: 'error',
      message: 'No puedes agregar la misma habilidad dos veces.',
    });
    expect(result.current.isSaving).toBe(false);
  });

  it('clears the feedback when the selection changes', async () => {
    vi.mocked(skillsService.saveMySkills).mockResolvedValue([PYTHON]);
    const { result } = await renderLoadedHook();

    await act(() => result.current.saveSkills());
    act(() => result.current.addSkill(SQL));

    expect(result.current.feedback).toBeNull();
  });

  it('blocks mutations (add, remove, custom create) while saveSkills is pending', async () => {
    let resolveSave!: (value: (typeof PYTHON)[]) => void;
    const savePromise = new Promise<(typeof PYTHON)[]>((resolve) => {
      resolveSave = resolve;
    });
    vi.mocked(skillsService.saveMySkills).mockReturnValue(savePromise);

    const { result } = await renderLoadedHook();
    expect(result.current.selectedSkills).toEqual([PYTHON]);

    let saveActionPromise: Promise<boolean> | undefined;
    act(() => {
      saveActionPromise = result.current.saveSkills();
    });
    expect(result.current.isSaving).toBe(true);

    act(() => {
      result.current.addSkill(SQL);
      result.current.removeSkill(PYTHON.id);
      result.current.createCustomSkill('Docker');
    });

    expect(result.current.selectedSkills).toEqual([PYTHON]);

    await act(async () => {
      resolveSave([PYTHON]);
      await saveActionPromise;
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.selectedSkills).toEqual([PYTHON]);
  });
});
