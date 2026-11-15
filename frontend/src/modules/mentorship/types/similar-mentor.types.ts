import type { MentorDirectoryItem } from './mentor-directory.types';

export type SimilarMentorsSectionProps = { returnTo?: string } & (
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'success'; mentors: MentorDirectoryItem[] }
  | { status: 'error'; onRetry: () => void }
);
