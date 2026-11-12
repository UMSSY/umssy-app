import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from '@/modules/profile';
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from '../config/work-experience-feedback.config';
import { workExperienceService } from '../services/work-experience.service';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import { useDeleteWorkExperience } from './use-delete-work-experience';

vi.mock('../services/work-experience.service', () => ({
  workExperienceService: {
    deleteWorkExperience: vi.fn(),
  },
}));

const EXPERIENCE: WorkExperienceItem = {
  id: 'experience-1',
  companyName: 'UMSS',
  position: 'Desarrollador',
  startDate: '2023-01',
  endDate: '2024-01',
  isCurrent: false,
  description: 'Desarrollo de aplicaciones.',
};

const SKILLS_PROFILE_QUERY_KEY = ['skills', 'profile'] as const;

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useDeleteWorkExperience', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    vi.mocked(workExperienceService.deleteWorkExperience).mockResolvedValue(
      undefined,
    );
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('elimina la experiencia e invalida las consultas de habilidades', async () => {
    const onDeleted = vi.fn();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteWorkExperience(onDeleted), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.deleteWorkExperience(EXPERIENCE);
    });

    expect(workExperienceService.deleteWorkExperience).toHaveBeenCalledWith(
      EXPERIENCE.id,
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: SKILLS_PROFILE_QUERY_KEY,
    });

    expect(result.current.feedback).toEqual({
      type: 'success',
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.deleteSuccess,
    });

    expect(onDeleted).toHaveBeenCalledWith(EXPERIENCE);
    expect(result.current.isDeleting).toBe(false);
  });

  it('muestra un error y no invalida consultas si falla la eliminación', async () => {
    const onDeleted = vi.fn();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    vi.mocked(workExperienceService.deleteWorkExperience).mockRejectedValue(
      new Error('Error al eliminar'),
    );

    const { result } = renderHook(() => useDeleteWorkExperience(onDeleted), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.deleteWorkExperience(EXPERIENCE);
    });

    expect(workExperienceService.deleteWorkExperience).toHaveBeenCalledWith(
      EXPERIENCE.id,
    );

    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();

    expect(result.current.feedback).toEqual({
      type: 'error',
      message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.deleteError,
    });

    expect(result.current.isDeleting).toBe(false);
  });
});
