import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { skillsAnalysisService } from '@/modules/matching/services/skills-analysis.service';
import { MY_SKILLS_QUERY_KEY } from '@/modules/skills';
import { renderHookWithQuery as renderHook } from '@/shared/testing/render-hook-with-query';
import {
  PROFILE_SKILLS_RADAR_QUERY_KEY,
  profileSkillsRadarService,
} from '@/modules/profile';
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from '../config/work-experience-feedback.config';
import { workExperienceService } from '../services/work-experience.service';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import type { WorkExperiencePayload } from '../types/work-experience-payload.types';
import { useSaveWorkExperience } from './use-save-work-experience';

vi.mock('../services/work-experience.service', () => ({
  workExperienceService: {
    createWorkExperience: vi.fn(),
    updateWorkExperience: vi.fn(),
  },
}));

const PAYLOAD: WorkExperiencePayload = {
  companyName: 'Synapse Labs',
  position: 'Desarrolladora web junior',
  startDate: '2025-03-01',
  endDate: null,
  isCurrent: true,
  description: 'Desarrollo con Python y Scrum',
};

const SAVED: WorkExperienceItem = {
  id: 'experience-1',
  ...PAYLOAD,
};

const ANALYSIS = {
  experienceId: 'experience-1',
  skills: [
    { id: 'skill-1', name: 'Python' },
    { id: 'skill-2', name: 'Scrum' },
  ],
  processingTimeMs: 320,
};

describe('useSaveWorkExperience', () => {
  beforeEach(() => {
    vi.mocked(workExperienceService.createWorkExperience).mockResolvedValue(
      SAVED,
    );

    vi.mocked(workExperienceService.updateWorkExperience).mockResolvedValue(
      SAVED,
    );
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('acknowledges a guide write before completeness refresh and finishes the preview after unmount', async () => {
    let finishPreview!: (value: typeof ANALYSIS) => void;
    vi.spyOn(skillsAnalysisService, 'previewExperience').mockReturnValueOnce(
      new Promise((resolve) => {
        finishPreview = resolve;
      }),
    );
    const onSaved = vi.fn();
    const { result, client, unmount } = renderHook(() =>
      useSaveWorkExperience(onSaved, { forGuide: true }),
    );
    let finishRefresh!: () => void;
    const refreshing = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const invalidations = vi
      .spyOn(client, 'invalidateQueries')
      .mockReturnValueOnce(refreshing);

    await act(async () => {
      await result.current.save(PAYLOAD);
    });

    expect(onSaved).toHaveBeenCalledOnce();
    expect(result.current.feedback?.type).toBe('success');
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isAnalyzing).toBe(true);
    expect(invalidations).toHaveBeenCalledWith({
      queryKey: ['profile', 'completeness'],
    });
    unmount();
    await act(async () => {
      finishRefresh();
      finishPreview(ANALYSIS);
    });
    await waitFor(() =>
      expect(invalidations).toHaveBeenCalledWith({
        queryKey: MY_SKILLS_QUERY_KEY,
      }),
    );
  });

  it('keeps guide writes successful if a background invalidation fails', async () => {
    vi.spyOn(skillsAnalysisService, 'previewExperience').mockResolvedValueOnce(
      ANALYSIS,
    );
    const onSaved = vi.fn();
    const { result, client } = renderHook(() =>
      useSaveWorkExperience(onSaved, { forGuide: true }),
    );
    vi.spyOn(client, 'invalidateQueries').mockRejectedValue(
      new Error('refresh unavailable'),
    );

    await act(async () => {
      await result.current.save(PAYLOAD);
    });
    await waitFor(() => expect(result.current.isAnalyzing).toBe(false));

    expect(onSaved).toHaveBeenCalledOnce();
    expect(result.current.feedback?.type).toBe('success');
    expect(result.current.isSaving).toBe(false);
  });

  it('creates the experience keeping the description as typed', async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useSaveWorkExperience(onSaved));

    await act(() => result.current.save(PAYLOAD));

    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith(
      PAYLOAD,
    );

    expect(onSaved).toHaveBeenCalledTimes(1);

    expect(result.current.feedback).toEqual({
      type: 'success',
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.createSuccess,
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('preserves capitalization, accents and punctuation in the description', async () => {
    const description =
      'Lideré APIs en Node.js, C++ y C#. ¡Gestión de proyectos!';

    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() =>
      result.current.save({
        ...PAYLOAD,
        description,
      }),
    );

    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith({
      ...PAYLOAD,
      description,
    });
  });

  it('updates the experience and preserves a null description', async () => {
    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() =>
      result.current.save(
        {
          ...PAYLOAD,
          description: null,
        },
        'experience-1',
      ),
    );

    expect(workExperienceService.updateWorkExperience).toHaveBeenCalledWith(
      'experience-1',
      {
        ...PAYLOAD,
        description: null,
      },
    );

    expect(result.current.feedback).toEqual({
      type: 'success',
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.updateSuccess,
    });
  });

  it('refreshes the skills queries after saving', async () => {
    const { result, client } = renderHook(() => useSaveWorkExperience(vi.fn()));

    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await act(() => result.current.save(PAYLOAD));

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: MY_SKILLS_QUERY_KEY,
      });

      expect(invalidate).toHaveBeenCalledWith({
        queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
      });
    });
  });

  it('does not ask for the full skills analysis again because the backend already refreshes it', async () => {
    const analyzeSkills = vi.spyOn(profileSkillsRadarService, 'analyzeSkills');
    const { result, client } = renderHook(() => useSaveWorkExperience(vi.fn()));
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await act(() => result.current.save(PAYLOAD));
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: MY_SKILLS_QUERY_KEY,
      }),
    );
    await waitFor(() => expect(result.current.isAnalyzing).toBe(false));

    expect(analyzeSkills).not.toHaveBeenCalled();
  });

  it('keeps the experience saved and shows success feedback', async () => {
    const onSaved = vi.fn();

    const { result } = renderHook(() => useSaveWorkExperience(onSaved));

    await act(() => result.current.save(PAYLOAD));

    expect(workExperienceService.createWorkExperience).toHaveBeenCalledWith(
      PAYLOAD,
    );

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.feedback?.type).toBe('success');
  });

  it('does not refresh skills when the experience could not be saved', async () => {
    vi.mocked(workExperienceService.createWorkExperience).mockRejectedValue(
      new Error('fail'),
    );

    const onSaved = vi.fn();

    const { result, client } = renderHook(() => useSaveWorkExperience(onSaved));

    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await act(() => result.current.save(PAYLOAD));

    expect(onSaved).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();

    expect(result.current.feedback).toEqual({
      type: 'error',
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.createError,
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('clears the feedback', async () => {
    const { result } = renderHook(() => useSaveWorkExperience(vi.fn()));

    await act(() => result.current.save(PAYLOAD));

    expect(result.current.feedback).not.toBeNull();

    act(() => result.current.clearFeedback());

    expect(result.current.feedback).toBeNull();
  });
});
