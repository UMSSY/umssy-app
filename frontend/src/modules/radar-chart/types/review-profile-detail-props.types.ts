import type { ReviewAction } from './review-action.types';
import type { ReviewProfile } from './review-profile.types';

export interface ReviewProfileDetailProps {
  profile: ReviewProfile | null;
  localAction: ReviewAction | null;
  onAction: (action: ReviewAction) => void;
}
