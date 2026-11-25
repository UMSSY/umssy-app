import type { MentorProfile } from "./mentor-profile.types";

export type MentorProfileHeaderProps = {
  mentor: MentorProfile;
  selectedArea?: string;
  showRequestAction?: boolean;
  selectedAreaId?: string;
  returnTo?: string;
};
