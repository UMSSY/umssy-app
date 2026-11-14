import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookWithQuery } from '@/shared/testing/render-hook-with-query';
import { useSaveEducation } from '@/modules/education/hooks/use-save-education';
import { useDeleteEducation } from '@/modules/education/hooks/use-delete-education';
import { useSaveWorkExperience } from '@/modules/work-experience/hooks/use-save-work-experience';
import { useDeleteWorkExperience } from '@/modules/work-experience/hooks/use-delete-work-experience';
import {
  useCreateCertification,
  useUpdateCertification,
} from '@/modules/certifications/hooks/use-certification-mutations';
import { useDeleteCertification } from '@/modules/certifications/hooks/use-delete-certification';
import { useSkills } from '@/modules/skills/hooks/use-skills';
import { useDetectedSkills } from '@/modules/skills/hooks/use-detected-skills';
import { DETECTED_SKILLS_QUERY_KEY } from '@/modules/skills/constants/skills.constants';
import { useSaveProfile } from './use-save-profile';
import { useProfileCompleteness } from './use-profile-completeness';
import { useInvalidateProfileCompleteness } from './use-invalidate-profile-completeness';

const api = vi.hoisted(() => ({
  completeness: vi.fn(),
  contact: vi.fn(),
  presentation: vi.fn(),
  createEducation: vi.fn(),
  updateEducation: vi.fn(),
  deleteEducation: vi.fn(),
  createExperience: vi.fn(),
  updateExperience: vi.fn(),
  deleteExperience: vi.fn(),
  createCertification: vi.fn(),
  updateCertification: vi.fn(),
  deleteCertification: vi.fn(),
  saveSkills: vi.fn(),
  catalog: vi.fn(),
  mySkills: vi.fn(),
  detected: vi.fn(),
}));
vi.mock('@/shared/contexts/auth-context', () => ({
  useAuth: () => ({ currentUserId: 'user-a', isLoading: false }),
}));
vi.mock('../services/profile-completeness.service', () => ({
  profileCompletenessService: { getCompleteness: api.completeness },
}));
vi.mock('../services/profile.service', () => ({
  profileService: {
    updatePersonalInfo: api.contact,
    updatePresentation: api.presentation,
  },
}));
vi.mock('@/modules/education/services/educations.service', () => ({
  educationsService: {
    createEducation: api.createEducation,
    updateEducation: api.updateEducation,
    deleteEducation: api.deleteEducation,
  },
}));
vi.mock('@/modules/work-experience/services/work-experience.service', () => ({
  workExperienceService: {
    createWorkExperience: api.createExperience,
    updateWorkExperience: api.updateExperience,
    deleteWorkExperience: api.deleteExperience,
  },
}));
vi.mock('@/modules/certifications/services/certifications.service', () => ({
  certificationsService: {
    createCertification: api.createCertification,
    updateCertification: api.updateCertification,
    deleteCertification: api.deleteCertification,
  },
}));
vi.mock('@/modules/skills/services/skills.service', () => ({
  skillsService: {
    saveMySkills: api.saveSkills,
    getCatalog: api.catalog,
    getMySkills: api.mySkills,
    getDetectedSkills: api.detected,
    analyzeSkills: vi.fn(),
  },
}));
vi.mock('../services/profile-skills-radar.service', () => ({
  profileSkillsRadarService: { analyzeSkills: vi.fn() },
}));
vi.mock('@/modules/matching/services/skills-analysis.service', () => ({
  skillsAnalysisService: { analyzeExperience: vi.fn() },
}));

const education = {
  id: 'education-1',
  institution: 'UMSS',
  degree: 'Software engineering',
  startDate: '2010-01-01',
  endDate: '2015-01-01',
  description: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};
const experience = {
  id: 'experience-1',
  companyName: 'Company',
  position: 'Developer',
  startDate: '2020-01-01',
  endDate: null,
  isCurrent: true,
  description: null,
};
const certification = {
  id: 'certification-1',
  name: 'Course',
  issuingOrganization: 'Institution',
  issueDate: '2025-01-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};
const contact = {
  firstName: 'Taylor',
  lastName: 'Smith',
  cityId: 'city-1',
  phone: '70000000',
  personalEmail: 'taylor@example.test',
};
const skill = { id: 'skill-1', name: 'React', isCustom: false };

function useActions() {
  return {
    progress: useProfileCompleteness(),
    profile: useSaveProfile(vi.fn()),
    education: useSaveEducation(vi.fn()),
    deleteEducation: useDeleteEducation(vi.fn()),
    experience: useSaveWorkExperience(vi.fn()),
    deleteExperience: useDeleteWorkExperience(vi.fn()),
    createCertification: useCreateCertification(),
    updateCertification: useUpdateCertification(),
    deleteCertification: useDeleteCertification(),
    skills: useSkills(),
  };
}

const cases: [
  string,
  (actions: ReturnType<typeof useActions>) => Promise<unknown>,
  ReturnType<typeof vi.fn>,
  number,
][] = [
  ['contact', (a) => a.profile.savePersonalInfo(contact), api.contact, 55],
  [
    'presentation',
    (a) =>
      a.profile.savePresentation({
        headline: 'Developer',
        aboutMe: 'Web applications',
      }),
    api.presentation,
    50,
  ],
  [
    'create education',
    (a) => a.education.save(education),
    api.createEducation,
    55,
  ],
  [
    'edit education',
    (a) => a.education.save(education, education.id),
    api.updateEducation,
    35,
  ],
  [
    'delete education',
    (a) => a.deleteEducation.deleteEducation(education),
    api.deleteEducation,
    15,
  ],
  [
    'create experience',
    (a) => a.experience.save(experience),
    api.createExperience,
    55,
  ],
  [
    'edit experience',
    (a) => a.experience.save(experience, experience.id),
    api.updateExperience,
    35,
  ],
  [
    'delete experience',
    (a) => a.deleteExperience.deleteWorkExperience(experience),
    api.deleteExperience,
    15,
  ],
  [
    'create certification',
    (a) => a.createCertification.mutate(certification),
    api.createCertification,
    45,
  ],
  [
    'edit certification',
    (a) =>
      a.updateCertification.mutate({
        id: certification.id,
        data: certification,
      }),
    api.updateCertification,
    35,
  ],
  [
    'delete certification',
    (a) => a.deleteCertification.deleteCertification(certification),
    api.deleteCertification,
    25,
  ],
  ['add skill', (a) => a.skills.saveSkills([skill]), api.saveSkills, 50],
  ['remove skill', (a) => a.skills.saveSkills([]), api.saveSkills, 20],
];

beforeEach(() => {
  for (const mock of Object.values(api))
    mock.mockResolvedValue({ id: 'saved' });
  api.completeness.mockResolvedValue({ percentage: 35, sections: [] });
  api.catalog.mockResolvedValue([skill]);
  api.mySkills.mockResolvedValue([]);
  api.saveSkills.mockResolvedValue([skill]);
  api.detected.mockResolvedValue({ status: 'pending', skills: [] });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

async function renderActions() {
  const hook = renderHookWithQuery(useActions);
  await waitFor(() => {
    expect(hook.result.current.progress.completeness?.percentage).toBe(35);
    expect(hook.result.current.skills.isLoading).toBe(false);
  });
  return hook;
}

describe('profile completeness synchronization', () => {
  it.each(cases)(
    'refreshes after successful %s without remounting',
    async (_name, action, _request, percentage) => {
      const { result } = await renderActions();
      api.completeness.mockResolvedValue({ percentage, sections: [] });
      await act(async () => {
        await action(result.current);
      });
      await waitFor(() =>
        expect(result.current.progress.completeness?.percentage).toBe(
          percentage,
        ),
      );
      expect(api.completeness).toHaveBeenCalledTimes(2);
    },
  );

  it.each(cases)(
    'does not refresh after failed %s',
    async (_name, action, request) => {
      const { result } = await renderActions();
      request.mockRejectedValue(new Error('Write failed'));
      await act(async () => {
        await action(result.current);
      });
      expect(result.current.progress.completeness?.percentage).toBe(35);
      expect(api.completeness).toHaveBeenCalledOnce();
    },
  );

  it('does not change progress for unsaved skill drafts', async () => {
    const { result } = await renderActions();
    act(() => result.current.skills.addSkill(skill));
    expect(api.completeness).toHaveBeenCalledOnce();
  });

  it('preserves a successful save if refreshing progress fails', async () => {
    const { result } = await renderActions();
    api.completeness.mockRejectedValue(new Error('Read failed'));
    await act(async () => {
      expect(await result.current.profile.savePersonalInfo(contact)).toBe(true);
    });
    await waitFor(() => expect(result.current.progress.error).not.toBeNull());
    expect(result.current.profile.feedback?.type).toBe('success');
  });

  it('cancels an initial stale read before refreshing after a write', async () => {
    let resolveOld!: (value: unknown) => void;
    api.completeness.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    const { result } = renderHookWithQuery(() => ({
      progress: useProfileCompleteness(),
      refresh: useInvalidateProfileCompleteness(),
    }));
    const initialSignal = api.completeness.mock.calls[0][0] as AbortSignal;
    api.completeness.mockResolvedValue({ percentage: 55, sections: [] });
    await act(() => result.current.refresh());
    expect(initialSignal.aborted).toBe(true);
    await act(async () => {
      resolveOld({ percentage: 0, sections: [] });
    });
    await waitFor(() =>
      expect(result.current.progress.completeness?.percentage).toBe(55),
    );
  });

  it('refreshes when background skill analysis finishes', async () => {
    const { result, client } = renderHookWithQuery(() => ({
      progress: useProfileCompleteness(),
      detected: useDetectedSkills(),
    }));
    await waitFor(() =>
      expect(result.current.detected.summary?.status).toBe('pending'),
    );
    api.completeness.mockResolvedValue({ percentage: 50, sections: [] });
    await act(async () => {
      client.setQueryData(DETECTED_SKILLS_QUERY_KEY, {
        status: 'ready',
        skills: [{ id: 'skill-1', name: 'React', evidenceCount: 1 }],
      });
    });
    await waitFor(() =>
      expect(result.current.progress.completeness?.percentage).toBe(50),
    );
  });
});
