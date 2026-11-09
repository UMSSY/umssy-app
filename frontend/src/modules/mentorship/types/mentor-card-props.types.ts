import type { MentorDirectoryItem } from "./mentor-directory.types";

export type MentorCardProps = {
  mentor: MentorDirectoryItem;
  isOwnProfile?: boolean;
  returnTo?: string;
  showAffinityBadge?: boolean;
  selectedArea?: string;
  highlightAvailability?: boolean;
};
