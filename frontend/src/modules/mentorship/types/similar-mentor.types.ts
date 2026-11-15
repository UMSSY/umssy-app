import type { MentorDirectoryItem } from './mentor-directory.types';

// UI-only role label. Reconcile with the backend contract in Task-10f.
export interface SimilarMentor extends Pick<
  MentorDirectoryItem,
  'id' | 'fullName' | 'technicalAreas' | 'orientationTypes' | 'isAvailable'
> {
  roleLabel: 'Mentor' | 'Mentora';
}
