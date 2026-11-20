import type { MentorParticipationRequest } from "./mentor-participation-request.types";

export type PendingParticipationProps = {
  request: MentorParticipationRequest;
  onCancelled?: () => void;
  showHeading?: boolean;
};
