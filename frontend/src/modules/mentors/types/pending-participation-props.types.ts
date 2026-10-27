import type { MentorParticipationRequestResponse } from "./mentor-participation-request-response.types";

export type PendingParticipationProps = {
  request: MentorParticipationRequestResponse;
  onCancelled?: () => void;
  showHeading?: boolean;
};
