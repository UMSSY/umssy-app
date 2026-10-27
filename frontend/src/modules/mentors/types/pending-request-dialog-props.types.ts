import type { usePendingParticipation } from "../hooks/use-pending-participation";
import type { MentorParticipationRequestResponse } from "./mentor-participation-request-response.types";

export type PendingRequestDialogProps = {
  state: ReturnType<typeof usePendingParticipation>;
  request: MentorParticipationRequestResponse;
};
