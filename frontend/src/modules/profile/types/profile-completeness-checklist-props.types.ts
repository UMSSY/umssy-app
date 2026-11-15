import type { ProfileCompletenessSection } from './profile-completeness-section.types';

export interface ProfileCompletenessChecklistProps {
  sections?: readonly ProfileCompletenessSection[] | null;
}
