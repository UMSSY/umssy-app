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
import { createProfileCompleteness } from '../testing/profile-completeness.fixture';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';

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
  createCertificationWithDocument: vi.fn(),
  updateCertificationWithDocument: vi.fn(),
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
    createWithDocument: api.createCertificationWithDocument,
    updateWithDocument: api.updateCertificationWithDocument,
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

interface SyncCase {
  name: string;
  section: ProfileCompletenessSectionId;
  operation: 'complete' | 'edit' | 'remove';
  action: (actions: ReturnType<typeof useActions>) => Promise<unknown>;
  request: ReturnType<typeof vi.fn>;
}

const document = new File(['certificate'], 'certificate.pdf', {
  type: 'application/pdf',
});
const cases: SyncCase[] = [
  {
    name: 'contact',
    section: 'contact',
    operation: 'complete',
    action: (a) => a.profile.savePersonalInfo(contact),
    request: api.contact,
  },
  {
    name: 'presentation',
    section: 'presentation',
    operation: 'complete',
    action: (a) =>
      a.profile.savePresentation({
        headline: 'Developer',
        aboutMe: 'Web applications',
      }),
    request: api.presentation,
  },
  {
    name: 'create education',
    section: 'education',
    operation: 'complete',
    action: (a) => a.education.save(education),
    request: api.createEducation,
  },
  {
    name: 'edit education',
    section: 'education',
    operation: 'edit',
    action: (a) => a.education.save(education, education.id),
    request: api.updateEducation,
  },
  {
    name: 'delete education',
    section: 'education',
    operation: 'remove',
    action: (a) => a.deleteEducation.deleteEducation(education),
    request: api.deleteEducation,
  },
  {
    name: 'create experience',
    section: 'work-experience',
    operation: 'complete',
    action: (a) => a.experience.save(experience),
    request: api.createExperience,
  },
  {
    name: 'edit experience',
    section: 'work-experience',
    operation: 'edit',
    action: (a) => a.experience.save(experience, experience.id),
    request: api.updateExperience,
  },
  {
    name: 'delete experience',
    section: 'work-experience',
    operation: 'remove',
    action: (a) => a.deleteExperience.deleteWorkExperience(experience),
    request: api.deleteExperience,
  },
  {
    name: 'create certification',
    section: 'certifications',
    operation: 'complete',
    action: (a) => a.createCertification.mutate(certification),
    request: api.createCertification,
  },
  {
    name: 'edit certification',
    section: 'certifications',
    operation: 'edit',
    action: (a) =>
      a.updateCertification.mutate({
        id: certification.id,
        data: certification,
      }),
    request: api.updateCertification,
  },
  {
    name: 'create certification with document',
    section: 'certifications',
    operation: 'complete',
    action: (a) =>
      a.createCertification.mutate({ data: certification, document }),
    request: api.createCertificationWithDocument,
  },
  {
    name: 'edit certification with document',
    section: 'certifications',
    operation: 'edit',
    action: (a) =>
      a.updateCertification.mutate({
        id: certification.id,
        data: certification,
        documentChange: { type: 'replace', file: document },
      }),
    request: api.updateCertificationWithDocument,
  },
  {
    name: 'delete certification',
    section: 'certifications',
    operation: 'remove',
    action: (a) => a.deleteCertification.deleteCertification(certification),
    request: api.deleteCertification,
  },
  {
    name: 'add skill',
    section: 'skills',
    operation: 'complete',
    action: (a) => a.skills.saveSkills([skill]),
    request: api.saveSkills,
  },
  {
    name: 'remove skill',
    section: 'skills',
    operation: 'remove',
    action: (a) => a.skills.saveSkills([]),
    request: api.saveSkills,
  },
];

const initialCompleteness = createProfileCompleteness([
  'contact',
  'presentation',
]);

beforeEach(() => {
  for (const mock of Object.values(api))
    mock.mockResolvedValue({ id: 'saved' });
  api.completeness.mockResolvedValue(initialCompleteness);
  api.catalog.mockResolvedValue([skill]);
  api.mySkills.mockResolvedValue([]);
  api.saveSkills.mockResolvedValue([skill]);
  api.detected.mockResolvedValue({ status: 'pending', skills: [] });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

async function renderActions(initial = initialCompleteness) {
  api.completeness.mockResolvedValue(initial);
  const hook = renderHookWithQuery(useActions);
  await waitFor(() => {
    expect(hook.result.current.progress.completeness).toEqual(initial);
    expect(hook.result.current.skills.isLoading).toBe(false);
  });
  return hook;
}

describe('profile completeness synchronization', () => {
  it.each(cases)(
    'refreshes percentage and all section statuses after successful $name without remounting',
    async ({ action, request, section, operation }) => {
      const initial = createProfileCompleteness(
        operation === 'complete' ? [] : [section],
      );
      const saved = createProfileCompleteness(
        operation === 'remove' ? [] : [section],
      );
      const { result } = await renderActions(initial);
      api.completeness.mockResolvedValue(saved);
      await act(async () => {
        await action(result.current);
      });
      await waitFor(() =>
        expect(result.current.progress.completeness).toEqual(saved),
      );
      expect(request).toHaveBeenCalledOnce();
      expect(api.completeness).toHaveBeenCalledTimes(2);
    },
  );

  it.each(cases)(
    'preserves percentage and all section statuses after failed $name',
    async ({ action, request, section, operation }) => {
      const initial = createProfileCompleteness(
        operation === 'complete' ? [] : [section],
      );
      const { result } = await renderActions(initial);
      request.mockRejectedValue(new Error('Write failed'));
      await act(async () => {
        await action(result.current);
      });
      expect(result.current.progress.completeness).toEqual(initial);
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
    const saved = createProfileCompleteness([
      'contact',
      'presentation',
      'education',
    ]);
    api.completeness.mockResolvedValue(saved);
    await act(() => result.current.refresh());
    expect(initialSignal.aborted).toBe(true);
    await act(async () => {
      resolveOld(createProfileCompleteness());
    });
    await waitFor(() =>
      expect(result.current.progress.completeness).toEqual(saved),
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
    const saved = createProfileCompleteness([
      'contact',
      'presentation',
      'skills',
    ]);
    api.completeness.mockResolvedValue(saved);
    await act(async () => {
      client.setQueryData(DETECTED_SKILLS_QUERY_KEY, {
        status: 'ready',
        skills: [{ id: 'skill-1', name: 'React', evidenceCount: 1 }],
      });
    });
    await waitFor(() =>
      expect(result.current.progress.completeness).toEqual(saved),
    );
  });
});
