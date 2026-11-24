'use client';

import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import { DocumentsCvContent } from './documents-cv-content';

export function DocumentsCvGuideStep(props: ProfileGuideStepProps) {
  return <DocumentsCvContent guideCallbacks={props} />;
}
