import type { MentorProfile } from "./mentor-profile.types";

export type MentorProfileHeaderProps = {
  mentor: MentorProfile;
  showRequestAction?: boolean;
  selectedAreaId?: string;
  returnTo?: string;
};
