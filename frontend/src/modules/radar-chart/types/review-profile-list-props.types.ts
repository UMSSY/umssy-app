import type { ReviewProfile } from './review-profile.types';

export interface ReviewProfileListProps {
  profiles: ReviewProfile[];
  selectedProfileId: number | null;
  onProfileSelect: (profile: ReviewProfile) => void;
}
