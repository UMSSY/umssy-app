import { describe, expect, it } from 'vitest';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import { createProfileGuideSession } from '../services/profile-guide-storage';
import type { ProfileCompletenessResponse } from '../types/profile-completeness-response.types';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';
import { getProfileGuideResumeStep } from './get-profile-guide-resume-step';

function completenessWithPending(
  ...pending: ProfileCompletenessSectionId[]
): ProfileCompletenessResponse {
  return {
    percentage: 0,
    sections: PROFILE_COMPLETENESS_SECTION_IDS.map((id) => ({
      id,
      weight: 1,
      isCompleted: !pending.includes(id),
    })),
  };
}

describe('getProfileGuideResumeStep', () => {
  it('resumes the last step when real profile data still marks it pending', () => {
    const session = {
      ...createProfileGuideSession(),
      lastStep: 'skills' as const,
      skipped: ['skills' as const],
    };
    expect(
      getProfileGuideResumeStep(
        completenessWithPending('education', 'skills'),
        session,
      ),
    ).toBe('skills');
  });

  it('replaces a completed last step with the first pending section that was not skipped', () => {
    const session = {
      ...createProfileGuideSession(),
      lastStep: 'presentation' as const,
      skipped: ['education' as const],
    };
    expect(
      getProfileGuideResumeStep(
        completenessWithPending('education', 'work-experience', 'skills'),
        session,
      ),
    ).toBe('work-experience');
  });

  it('uses the guide order even when the server returns sections in a different order', () => {
    const completeness = completenessWithPending('contact', 'education', 'cv');
    completeness.sections.reverse();
    expect(
      getProfileGuideResumeStep(completeness, createProfileGuideSession()),
    ).toBe('contact');
  });

  it('returns to the first pending step after every pending section was skipped', () => {
    const session = {
      ...createProfileGuideSession(),
      skipped: ['skills', 'cv'] as ProfileCompletenessSectionId[],
    };
    expect(
      getProfileGuideResumeStep(
        completenessWithPending('skills', 'cv'),
        session,
      ),
    ).toBe('skills');
  });

  it('keeps a stable initial fallback when all sections are complete or absent', () => {
    const session = {
      ...createProfileGuideSession(),
      completed: true,
      lastStep: 'cv' as const,
    };
    expect(getProfileGuideResumeStep(completenessWithPending(), session)).toBe(
      'contact',
    );
    expect(
      getProfileGuideResumeStep({ percentage: 0, sections: [] }, session),
    ).toBe('contact');
  });
});
