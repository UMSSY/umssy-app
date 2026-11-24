import { act, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderHookWithQuery } from '@/shared/testing/render-hook-with-query';
import { skillsService } from '../services/skills.service';
import { DETECTED_SKILLS_QUERY_KEY } from '../constants/skills.constants';
import { useDetectedSkills } from './use-detected-skills';
import { useSkills } from './use-skills';

vi.mock('../services/skills.service', () => ({
  skillsService: {
    getDetectedSkills: vi.fn(),
    getMySkills: vi.fn(),
    getCatalog: vi.fn(),
  },
}));
afterEach(() => vi.clearAllMocks());
it('refreshes the general list when an asynchronous analysis finishes, including removal', async () => {
  vi.mocked(skillsService.getDetectedSkills).mockResolvedValue({
    status: 'pending',
    skills: [],
  });
  vi.mocked(skillsService.getCatalog).mockResolvedValue([]);
  vi.mocked(skillsService.getMySkills).mockResolvedValue([]);
  const { result, client } = renderHookWithQuery(() => {
    useDetectedSkills();
    return useSkills();
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.selectedSkills).toEqual([]);
  const skill = {
    id: 'python',
    name: 'Python',
    origins: ['experience' as const],
  };
  vi.mocked(skillsService.getMySkills).mockResolvedValue([skill]);
  act(() =>
    client.setQueryData(DETECTED_SKILLS_QUERY_KEY, {
      status: 'ready',
      skills: [{ id: 'python', name: 'Python', evidenceCount: 2 }],
    }),
  );
  await waitFor(() => expect(result.current.selectedSkills).toEqual([skill]));
  vi.mocked(skillsService.getMySkills).mockResolvedValue([]);
  act(() =>
    client.setQueryData(DETECTED_SKILLS_QUERY_KEY, {
      status: 'ready',
      skills: [],
    }),
  );
  await waitFor(() => expect(result.current.selectedSkills).toEqual([]));
});
