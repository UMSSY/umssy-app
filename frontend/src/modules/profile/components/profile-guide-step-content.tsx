'use client';

import dynamic from 'next/dynamic';
import type { ProfileGuideStepContentProps } from '../types/profile-guide-step-content-props.types';
import { PersonalInfoSettings } from './personal-info-settings';
import { PresentationSettings } from './presentation-settings';
import { loadProfileGuideStep } from '../utils/profile-guide-step-loaders';

const loading = () => <p role="status">Cargando formulario...</p>;
const EducationGuideStep = dynamic(() => loadProfileGuideStep('education'), {
  loading,
});
const WorkExperienceGuideStep = dynamic(
  () => loadProfileGuideStep('work-experience'),
  { loading },
);
const SkillsGuideStep = dynamic(() => loadProfileGuideStep('skills'), {
  loading,
});
const CertificationGuideStep = dynamic(
  () => loadProfileGuideStep('certifications'),
  { loading },
);
const DocumentsCvGuideStep = dynamic(() => loadProfileGuideStep('cv'), {
  loading,
});

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
