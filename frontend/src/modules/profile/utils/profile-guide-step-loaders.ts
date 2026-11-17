import type { ComponentType } from 'react';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';

const importers = {
  education: () =>
    import('@/modules/educations').then((module) => ({
      default: module.EducationGuideStep,
    })),
  'work-experience': () =>
    import('@/modules/work-experience').then((module) => ({
      default: module.WorkExperienceGuideStep,
    })),
  skills: () =>
    import('@/modules/skills').then((module) => ({
      default: module.SkillsGuideStep,
    })),
  certifications: () =>
    import('@/modules/certifications').then((module) => ({
      default: module.CertificationGuideStep,
    })),
  cv: () =>
    import('@/modules/cv').then((module) => ({
      default: module.DocumentsCvGuideStep,
    })),
};
const pending = new Map<
  string,
  Promise<{ default: ComponentType<ProfileGuideStepProps> }>
>();

export function loadProfileGuideStep(step: keyof typeof importers) {
  const existing = pending.get(step);
  if (existing) return existing;
  const request = importers[step]().catch((error: unknown) => {
    pending.delete(step);
    throw error;
  });
  pending.set(step, request);
  return request;
}

export async function preloadProfileGuideStep(
  step: ProfileCompletenessSectionId,
) {
  if (step === 'contact' || step === 'presentation') return;
  await loadProfileGuideStep(step).catch(() => undefined);
}
