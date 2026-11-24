import type { SessionResponse } from "./session-response.types";

export interface SessionInactivityGuardProps {
  session?: SessionResponse | null;
}
