import type { MentorDirectoryItem } from "./mentor-directory.types";

export type MentorDirectoryGridProps = {
  mentors: MentorDirectoryItem[];
  currentUserId?: string | null;
  returnTo?: string;
  showAffinityBadge?: boolean;
  selectedArea?: string;
  highlightAvailability?: boolean;
};
