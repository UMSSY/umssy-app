import type { ReactNode } from 'react';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';

export interface DocumentsCvContentProps {
  guideCallbacks?: ProfileGuideStepProps;
  verification?: ReactNode;
}
