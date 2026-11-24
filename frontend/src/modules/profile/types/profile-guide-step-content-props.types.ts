import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import type { ProfileCompletenessSectionId } from './profile-completeness-section-id.types';

export interface ProfileGuideStepContentProps extends ProfileGuideStepProps {
  step: ProfileCompletenessSectionId;
}
