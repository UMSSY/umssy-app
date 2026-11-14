'use client';

import dynamic from 'next/dynamic';
import type { ProfileGuideStepContentProps } from '../types/profile-guide-step-content-props.types';
import { PersonalInfoSettings } from './personal-info-settings';
import { PresentationSettings } from './presentation-settings';

const loading = () => <p role="status">Cargando formulario...</p>;
const EducationGuideStep = dynamic(
  () =>
    import('@/modules/education').then((module) => module.EducationGuideStep),
  { loading },
);
const WorkExperienceGuideStep = dynamic(
  () =>
    import('@/modules/work-experience').then(
      (module) => module.WorkExperienceGuideStep,
    ),
  { loading },
);
const SkillsGuideStep = dynamic(
  () => import('@/modules/skills').then((module) => module.SkillsGuideStep),
  { loading },
);
const CertificationGuideStep = dynamic(
  () =>
    import('@/modules/certifications').then(
      (module) => module.CertificationGuideStep,
    ),
  { loading },
);
const DocumentsCvGuideStep = dynamic(
  () =>
    import('@/modules/documents').then((module) => module.DocumentsCvGuideStep),
  { loading },
);

export function ProfileGuideStepContent({
  step,
  ...callbacks
}: ProfileGuideStepContentProps) {
  switch (step) {
    case 'contact':
      return <PersonalInfoSettings guide={callbacks} />;
    case 'presentation':
      return <PresentationSettings guide={callbacks} />;
    case 'education':
      return <EducationGuideStep {...callbacks} />;
    case 'work-experience':
      return <WorkExperienceGuideStep {...callbacks} />;
    case 'skills':
      return <SkillsGuideStep {...callbacks} />;
    case 'certifications':
      return <CertificationGuideStep {...callbacks} />;
    case 'cv':
      return <DocumentsCvGuideStep {...callbacks} />;
  }
}
